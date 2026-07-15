import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TWITCH_CLIENT_ID = Deno.env.get('TWITCH_CLIENT_ID')!
const TWITCH_CLIENT_SECRET = Deno.env.get('TWITCH_CLIENT_SECRET')!

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers })

  try {
    const { gameIds } = await req.json()
    
    if (!gameIds || gameIds.length === 0) {
      return new Response(JSON.stringify([]), { headers: { ...headers, 'Content-Type': 'application/json' }})
    }

    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, { method: 'POST' })
    const { access_token } = await tokenRes.json()

    // IGDB caps `where id = (...)` at 500 ids per request, and a library can easily exceed the
    // old hardcoded `limit 50` here — any id past that cutoff silently came back with no cover/name.
    const uniqueIds = [...new Set(gameIds)]
    const CHUNK_SIZE = 500
    const games: any[] = []

    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
      const chunk = uniqueIds.slice(i, i + CHUNK_SIZE)
      const igdbRes = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${access_token}`
        },
        body: `fields name, cover.url, summary, platforms.name; where id = (${chunk.join(',')}); limit ${CHUNK_SIZE};`
      })
      const chunkGames = await igdbRes.json()
      if (Array.isArray(chunkGames)) games.push(...chunkGames)
    }

    return new Response(JSON.stringify(games), { headers: { ...headers, 'Content-Type': 'application/json' }})
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers, status: 400 })
  }
})