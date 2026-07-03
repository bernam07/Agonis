import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { HowLongToBeatService } from "npm:howlongtobeat"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lidar com o preflight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameName } = await req.json()
    
    if (!gameName) {
      throw new Error("Game name is required")
    }

    const hltbService = new HowLongToBeatService()
    const results = await hltbService.search(gameName)
    
    // Retorna o resultado mais exato (o primeiro da lista de resultados)
    const bestResult = results.length > 0 ? results[0] : null

    return new Response(JSON.stringify(bestResult), {
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