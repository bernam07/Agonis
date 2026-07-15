import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const KOFI_VERIFICATION_TOKEN = Deno.env.get('KOFI_VERIFICATION_TOKEN') ?? ''

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Ko-fi has no OAuth/account-linking step, so the only way to know which Agonis
// account a payment belongs to is the free-text support message. We ask users to
// include their username there and match it as a whole word (not a substring) so
// e.g. "bob" in a message doesn't accidentally match a user named "bobby".
function extractUsernameCandidates(message: string): string[] {
  return [...new Set(
    message
      .split(/[^a-zA-Z0-9_]+/)
      .map((word) => word.trim())
      .filter(Boolean)
  )]
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Ko-fi POSTs application/x-www-form-urlencoded with a single `data` field
    // containing the actual payload as a JSON string.
    const form = await req.formData()
    const raw = form.get('data')
    if (typeof raw !== 'string') {
      return new Response('Missing data field', { status: 400 })
    }
    const payload = JSON.parse(raw)

    if (!KOFI_VERIFICATION_TOKEN || payload.verification_token !== KOFI_VERIFICATION_TOKEN) {
      return new Response('Invalid verification token', { status: 401 })
    }

    const message = String(payload.message ?? '')
    const candidates = extractUsernameCandidates(message)

    let matches: { id: string; username: string }[] = []
    if (candidates.length > 0) {
      const { data } = await supabaseClient
        .from('profiles')
        .select('id, username')
        .in('username', candidates)
      matches = data ?? []
    }

    const matched = matches.length === 1 ? matches[0] : null

    await supabaseClient.from('kofi_payments').insert({
      kofi_transaction_id: payload.kofi_transaction_id ?? null,
      email: payload.email ?? null,
      from_name: payload.from_name ?? null,
      message,
      amount: payload.amount ?? null,
      currency: payload.currency ?? null,
      type: payload.type ?? null,
      matched_user_id: matched?.id ?? null,
      matched_username: matched?.username ?? null,
      ambiguous: matches.length > 1,
    })

    if (matched) {
      await supabaseClient.from('profiles').update({ is_premium: true }).eq('id', matched.id)
    }

    // Ko-fi only checks for a 200 response, not the body.
    return new Response('ok', { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
