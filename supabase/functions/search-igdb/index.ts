import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Retrieve the secure variables
const TWITCH_CLIENT_ID = Deno.env.get('TWITCH_CLIENT_ID')!
const TWITCH_CLIENT_SECRET = Deno.env.get('TWITCH_CLIENT_SECRET')!

serve(async (req) => {
  // Allow Cross-Origin Requests (CORS) so your web app can call this
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers })

  try {
    // Get the search term from the incoming request
    const { searchQuery } = await req.json()

    // 1. Authenticate with Twitch to get a temporary Access Token
    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
      method: 'POST',
    })
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // 2. Query IGDB using the unique Apicalypse syntax
    const igdbRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
      body: `search "${searchQuery}"; fields name, cover.url, first_release_date, platforms.name; limit 10;`
    })
    
    const games = await igdbRes.json()

    // Return the clean JSON to Agonis
    return new Response(JSON.stringify(games), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})