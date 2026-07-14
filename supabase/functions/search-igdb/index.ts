import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchQuery, offset = 0, limit = 20 } = await req.json()
    const pageLimit = Math.min(Number(limit) || 20, 50)
    const pageOffset = Math.max(Number(offset) || 0, 0)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: cachedGames } = await supabaseClient
      .from('games_cache')
      .select('*')
      .ilike('name', `%${searchQuery}%`)
      .range(pageOffset, pageOffset + pageLimit - 1)

    if (cachedGames && cachedGames.length === pageLimit) {
      return new Response(JSON.stringify(cachedGames), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const clientId = Deno.env.get('TWITCH_CLIENT_ID')
    const clientSecret = Deno.env.get('TWITCH_CLIENT_SECRET')

    const tokenResponse = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: 'POST' }
    )
    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    const igdbResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId ?? '',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: `search "${searchQuery}"; fields name, cover.url, summary, platforms.name; where category = 0 & version_parent = null & status != (6,7); limit ${pageLimit}; offset ${pageOffset};`
    })

    const igdbData = await igdbResponse.json()

    if (Array.isArray(igdbData)) {
      for (const game of igdbData) {
        await supabaseClient.from('games_cache').upsert({
          id: game.id,
          name: game.name,
          cover: game.cover ?? null,
          summary: game.summary ?? null,
          platforms: game.platforms ?? null
        }, { onConflict: 'id' })
      }
    }

    return new Response(JSON.stringify(igdbData), {
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