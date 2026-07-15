import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_GAMES_TO_MATCH = 60
// IGDB enforces ~4 requests/second per app; stay comfortably under that.
const IGDB_REQUEST_DELAY_MS = 280

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Accepts a raw SteamID64, a vanity name, or a full profile URL
// (https://steamcommunity.com/id/<vanity>/ or /profiles/<steamid64>/).
function extractSteamIdentifier(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '')
  const urlMatch = trimmed.match(/steamcommunity\.com\/(id|profiles)\/([^/?#]+)/i)
  if (urlMatch) return urlMatch[2]
  return trimmed
}

async function getIgdbToken() {
  const clientId = Deno.env.get('TWITCH_CLIENT_ID') ?? ''
  const clientSecret = Deno.env.get('TWITCH_CLIENT_SECRET') ?? ''
  if (!clientId || !clientSecret) {
    throw new Error('IGDB credentials are not configured (TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET).')
  }
  const tokenResponse = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  const tokenData = await tokenResponse.json()
  if (!tokenData.access_token) {
    throw new Error(`Failed to get IGDB access token: ${JSON.stringify(tokenData).slice(0, 200)}`)
  }
  return { accessToken: tokenData.access_token, clientId }
}

function cleanGameName(name: string): string {
  // Steam appends trademark/registered symbols and sometimes trailing whitespace to titles.
  return name.replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim()
}

async function matchIgdbGame(rawName: string, accessToken: string, clientId: string): Promise<{ match: any; debug?: string }> {
  const name = cleanGameName(rawName)
  const safeName = name.replace(/"/g, '\\"')
  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'text/plain',
    },
    // Fetch unfiltered candidates and filter in JS: combining IGDB's fuzzy `search` with a
    // strict `where` can zero out results for titles whose top relevance matches are mostly
    // remasters/editions, since the filter has nothing left in that limited candidate set to keep.
    body: `search "${safeName}"; fields name, cover.url, category; limit 10;`,
  })
  const rawText = await response.text()

  let candidates: any
  try {
    candidates = JSON.parse(rawText)
  } catch {
    return { match: null, debug: `Non-JSON IGDB response (status ${response.status}): ${rawText.slice(0, 200)}` }
  }
  if (!Array.isArray(candidates)) {
    return { match: null, debug: `IGDB error (status ${response.status}): ${rawText.slice(0, 200)}` }
  }

  // IGDB omits fields at their default value, so a main game's `category` (default 0) is
  // frequently absent from the response rather than explicitly `0` — treat missing as main game.
  const results = candidates.filter((g: any) => g.category === 0 || g.category === undefined)
  if (results.length === 0) return { match: null }

  const exact = results.find((g: any) => g.name?.toLowerCase() === name.toLowerCase())
  return { match: exact ?? results[0] }
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
    let resolvedId = extractSteamIdentifier(String(steamId))

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
      return new Response(JSON.stringify({ imported: 0, alreadyTracked: 0, unmatched: 0, message: 'No games found on this Steam profile. Make sure your profile and game details are set to public.' }), {
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
    let alreadyTracked = 0
    const unmatchedNames: string[] = []
    const rowsToInsert: any[] = []
    const matchedListRows: any[] = []
    let firstDebug: string | undefined

    for (let i = 0; i < topGames.length; i++) {
      if (i > 0) await sleep(IGDB_REQUEST_DELAY_MS)
      const steamGame = topGames[i]
      const { match, debug } = await matchIgdbGame(steamGame.name, accessToken, clientId ?? '')
      if (debug && !firstDebug) firstDebug = debug
      if (!match) {
        unmatchedNames.push(steamGame.name)
        continue
      }
      if (existingIgdbIds.has(Number(match.id))) {
        alreadyTracked++
        continue
      }
      existingIgdbIds.add(Number(match.id))
      rowsToInsert.push({ user_id: user.id, igdb_id: match.id, status: 'backlog' })
      matchedListRows.push({ id: match.id, game_name: match.name, game_cover: match.cover?.url ?? null })
      imported++
    }

    let insertError: string | undefined
    if (rowsToInsert.length > 0) {
      const { error: listGamesError } = await supabaseClient.from('list_games').upsert(matchedListRows)
      const { error: userGamesError } = await supabaseClient.from('user_games').insert(rowsToInsert)
      insertError = userGamesError?.message ?? listGamesError?.message
    }

    return new Response(JSON.stringify({
      imported,
      alreadyTracked,
      unmatched: unmatchedNames.length,
      unmatchedSample: unmatchedNames.slice(0, 5),
      ...(firstDebug ? { debug: firstDebug } : {}),
      ...(insertError ? { insertError } : {}),
    }), {
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
