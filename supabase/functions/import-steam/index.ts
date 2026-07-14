import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_GAMES_TO_MATCH = 60

async function getIgdbToken() {
  const clientId = Deno.env.get('TWITCH_CLIENT_ID')
  const clientSecret = Deno.env.get('TWITCH_CLIENT_SECRET')
  const tokenResponse = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  const tokenData = await tokenResponse.json()
  return { accessToken: tokenData.access_token, clientId }
}

async function matchIgdbGame(name: string, accessToken: string, clientId: string) {
  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'text/plain',
    },
    body: `search "${name}"; fields name, cover.url; where category = 0 & version_parent = null & status != (6,7); limit 5;`,
  })
  const results = await response.json()
  if (!Array.isArray(results) || results.length === 0) return null

  const exact = results.find((g: any) => g.name?.toLowerCase() === name.toLowerCase())
  return exact ?? results[0]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')
    const jwt = authHeader.replace('Bearer ', '')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt)
    if (userError || !user) throw new Error('Not authenticated')

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()
    if (!profile?.is_premium) {
      return new Response(JSON.stringify({ error: 'Steam import is a Premium feature.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const { steamId } = await req.json()
    if (!steamId) throw new Error('Missing steamId')

    const steamApiKey = Deno.env.get('STEAM_API_KEY')
    let resolvedId = String(steamId).trim()

    if (!/^\d{17}$/.test(resolvedId)) {
      const vanityResponse = await fetch(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${steamApiKey}&vanityurl=${encodeURIComponent(resolvedId)}`
      )
      const vanityData = await vanityResponse.json()
      if (vanityData?.response?.success !== 1) {
        throw new Error('Could not resolve Steam profile. Check your Steam ID or profile URL.')
      }
      resolvedId = vanityData.response.steamid
    }

    const ownedGamesResponse = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${steamApiKey}&steamid=${resolvedId}&include_appinfo=true&format=json`
    )
    const ownedGamesData = await ownedGamesResponse.json()
    const steamGames: any[] = ownedGamesData?.response?.games ?? []

    if (steamGames.length === 0) {
      return new Response(JSON.stringify({ imported: 0, skipped: 0, message: 'No games found on this Steam profile (it may be private).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { data: existingGames } = await supabaseClient
      .from('user_games')
      .select('igdb_id')
      .eq('user_id', user.id)
    const existingIgdbIds = new Set((existingGames ?? []).map((g: any) => Number(g.igdb_id)))

    const topGames = steamGames
      .sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))
      .slice(0, MAX_GAMES_TO_MATCH)

    const { accessToken, clientId } = await getIgdbToken()

    let imported = 0
    let skipped = 0
    const rowsToInsert: any[] = []
    const matchedListRows: any[] = []

    for (const steamGame of topGames) {
      const match = await matchIgdbGame(steamGame.name, accessToken, clientId ?? '')
      if (!match) {
        skipped++
        continue
      }
      if (existingIgdbIds.has(Number(match.id))) {
        skipped++
        continue
      }
      existingIgdbIds.add(Number(match.id))
      rowsToInsert.push({ user_id: user.id, igdb_id: match.id, status: 'backlog' })
      matchedListRows.push({ id: match.id, game_name: match.name, game_cover: match.cover?.url ?? null })
      imported++
    }

    if (rowsToInsert.length > 0) {
      await supabaseClient.from('list_games').upsert(matchedListRows)
      await supabaseClient.from('user_games').insert(rowsToInsert)
    }

    return new Response(JSON.stringify({ imported, skipped }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
