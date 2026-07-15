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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')
    const jwt = authHeader.replace('Bearer ', '')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt)
    if (userError || !user) throw new Error('Not authenticated')

    const { confirmUsername } = await req.json()
    const { data: profile } = await supabaseClient.from('profiles').select('username').eq('id', user.id).single()
    if (!profile || confirmUsername !== profile.username) {
      return new Response(JSON.stringify({ error: 'Username confirmation did not match.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const userId = user.id

    // Delete child rows first (FK-safe order) — this doesn't rely on ON DELETE CASCADE being
    // configured, since that isn't guaranteed across every table in this schema.
    const { data: ownLists } = await supabaseClient.from('lists').select('id').eq('user_id', userId)
    const ownListIds = (ownLists ?? []).map((l: any) => l.id)
    if (ownListIds.length > 0) {
      await supabaseClient.from('list_games').delete().in('list_id', ownListIds)
    }

    await Promise.all([
      supabaseClient.from('comments').delete().eq('user_id', userId),
      supabaseClient.from('likes').delete().eq('user_id', userId),
      supabaseClient.from('notifications').delete().eq('receiver_id', userId),
      supabaseClient.from('notifications').delete().eq('actor_id', userId),
      supabaseClient.from('game_screenshots').delete().eq('user_id', userId),
      supabaseClient.from('follows').delete().eq('follower_id', userId),
      supabaseClient.from('follows').delete().eq('following_id', userId),
      supabaseClient.from('follow_requests').delete().eq('sender_id', userId),
      supabaseClient.from('follow_requests').delete().eq('receiver_id', userId),
      supabaseClient.from('blocked_users').delete().eq('blocker_id', userId),
      supabaseClient.from('blocked_users').delete().eq('blocked_id', userId),
      supabaseClient.from('reports').delete().eq('reporter_id', userId),
    ])

    await supabaseClient.from('lists').delete().eq('user_id', userId)
    await supabaseClient.from('posts').delete().eq('user_id', userId)
    await supabaseClient.from('user_games').delete().eq('user_id', userId)
    await supabaseClient.from('profiles').delete().eq('id', userId)

    const { error: deleteAuthError } = await supabaseClient.auth.admin.deleteUser(userId)
    if (deleteAuthError) throw deleteAuthError

    return new Response(JSON.stringify({ success: true }), {
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
