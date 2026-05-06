import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { processarEventoStripe, verificarAssinaturaWebhook } from '@residencia-med/billing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret nao configurado' }, { status: 500 })
  }

  const body = await req.text()
  const headerStore = await headers()
  const signature = headerStore.get('stripe-signature')
  if (!signature) return new NextResponse('Missing signature', { status: 400 })

  let evento
  try {
    evento = verificarAssinaturaWebhook(body, signature, secret)
  } catch (e) {
    console.error('[stripe] assinatura invalida', e)
    return new NextResponse('Invalid signature', { status: 400 })
  }

  try {
    await processarEventoStripe(evento)
    return NextResponse.json({ received: true })
  } catch (e) {
    console.error(`[stripe] erro processando ${evento.type}`, e)
    return NextResponse.json(
      { error: 'Erro ao processar evento, retentando' },
      { status: 500 },
    )
  }
}
