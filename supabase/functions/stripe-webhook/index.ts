import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  if (!signature) {
    return new Response('Missing Stripe-Signature header', { status: 400 })
  }

  let event: any
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider
    )
  } catch (error: any) {
    return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.client_reference_id
        if (userId) {
          await supabaseClient
            .from('profiles')
            .update({
              is_premium: true,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
            })
            .eq('id', userId)
        }
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const isActive = subscription.status === 'active' || subscription.status === 'trialing'
        await supabaseClient
          .from('profiles')
          .update({ is_premium: isActive })
          .eq('stripe_customer_id', subscription.customer)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await supabaseClient
          .from('profiles')
          .update({ is_premium: false })
          .eq('stripe_customer_id', subscription.customer)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
