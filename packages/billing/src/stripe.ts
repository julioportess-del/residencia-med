import Stripe from 'stripe'

const KEY = process.env.STRIPE_SECRET_KEY

let cliente: Stripe | null = null

export function stripe(): Stripe {
  if (!KEY) {
    throw new Error('STRIPE_SECRET_KEY ausente no ambiente')
  }
  if (!cliente) {
    cliente = new Stripe(KEY, {
      apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion,
      typescript: true,
    })
  }
  return cliente
}

export type StripeWebhookEvent = Stripe.Event

export function verificarAssinaturaWebhook(
  body: string,
  signature: string,
  secret: string,
): Stripe.Event {
  return stripe().webhooks.constructEvent(body, signature, secret)
}
