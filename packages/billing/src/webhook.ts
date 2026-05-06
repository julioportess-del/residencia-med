import type Stripe from 'stripe'
import { prisma, type PlanoOrg, type PlanoUsuario, type StatusAssinatura } from '@residencia-med/db'
import { stripe } from './stripe'
import type { PlanoCodigo, PlanoOrgCodigo } from './plans'

/**
 * Processa evento Stripe de forma idempotente.
 * Doc: docs/ARCHITECTURE.md secao 9.
 */
export async function processarEventoStripe(event: Stripe.Event): Promise<void> {
  // Idempotencia: tabela EventoStripe registra processamento.
  const ja = await prisma.eventoStripe.findUnique({ where: { stripeEventId: event.id } })
  if (ja?.processadoEm) return

  await prisma.eventoStripe.upsert({
    where: { stripeEventId: event.id },
    create: { stripeEventId: event.id, tipo: event.type, payload: event as never },
    update: { tipo: event.type, payload: event as never, erro: null },
  })

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await onSubscriptionUpsert(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await onSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await onInvoiceFailed(event.data.object as Stripe.Invoice)
        break
      default:
        // ignorado de propocito
        break
    }
    await prisma.eventoStripe.update({
      where: { stripeEventId: event.id },
      data: { processadoEm: new Date() },
    })
  } catch (e) {
    await prisma.eventoStripe.update({
      where: { stripeEventId: event.id },
      data: { erro: (e as Error).message },
    })
    throw e
  }
}

async function onCheckoutCompleted(s: Stripe.Checkout.Session): Promise<void> {
  if (!s.customer || typeof s.customer !== 'string') return
  if (!s.subscription || typeof s.subscription !== 'string') return

  const sub = await stripe().subscriptions.retrieve(s.subscription)
  if (ehAssinaturaOrg(sub)) await sincronizarAssinaturaOrg(sub)
  else await sincronizarAssinatura(sub)
}

async function onSubscriptionUpsert(sub: Stripe.Subscription): Promise<void> {
  if (ehAssinaturaOrg(sub)) await sincronizarAssinaturaOrg(sub)
  else await sincronizarAssinatura(sub)
}

async function onSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  if (ehAssinaturaOrg(sub)) {
    await prisma.assinaturaOrg.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        status: 'CANCELADA',
        canceladaEm: new Date(),
        stripeSubscriptionId: null,
      },
    })
  } else {
    await prisma.assinatura.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        status: 'CANCELADA',
        canceladaEm: new Date(),
        stripeSubscriptionId: null,
        plano: 'FREE',
      },
    })
  }
}

async function onInvoiceFailed(inv: Stripe.Invoice): Promise<void> {
  const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id
  if (!customerId) return
  await prisma.assinatura.updateMany({
    where: { stripeCustomerId: customerId },
    data: { status: 'INADIMPLENTE' },
  })
  await prisma.assinaturaOrg.updateMany({
    where: { stripeCustomerId: customerId },
    data: { status: 'INADIMPLENTE' },
  })
}

function ehAssinaturaOrg(sub: Stripe.Subscription): boolean {
  return sub.metadata?.tipo === 'org' || Boolean(sub.metadata?.organizationId)
}

async function sincronizarAssinatura(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const userId = sub.metadata?.userId
  const planoMeta = sub.metadata?.plano as PlanoCodigo | undefined

  if (!userId) {
    // tentar resolver por customerId
    const a = await prisma.assinatura.findFirst({ where: { stripeCustomerId: customerId } })
    if (!a) return
    void planoMeta
  }

  const status = mapearStatus(sub.status)
  const plano = (planoMeta ?? inferirPlanoPorPriceId(sub)) as PlanoUsuario
  const validaAte = new Date(sub.current_period_end * 1000)
  const trialAte = sub.trial_end ? new Date(sub.trial_end * 1000) : null

  const priceId = sub.items.data[0]?.price.id

  await prisma.assinatura.upsert({
    where: { stripeCustomerId: customerId },
    create: {
      userId: userId ?? '',
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      plano,
      status,
      iniciadaEm: new Date(sub.start_date * 1000),
      validaAte,
      trialAte,
    },
    update: {
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      plano,
      status,
      validaAte,
      trialAte,
    },
  })
}

function mapearStatus(s: Stripe.Subscription.Status): StatusAssinatura {
  switch (s) {
    case 'active':
      return 'ATIVA'
    case 'trialing':
      return 'TRIAL'
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELADA'
    case 'past_due':
    case 'unpaid':
      return 'INADIMPLENTE'
    default:
      return 'EXPIRADA'
  }
}

function inferirPlanoPorPriceId(sub: Stripe.Subscription): PlanoCodigo {
  const priceId = sub.items.data[0]?.price.id
  if (!priceId) return 'FREE'
  if (priceId === process.env.STRIPE_PRICE_PREMIUM_MONTHLY) return 'PREMIUM'
  if (priceId === process.env.STRIPE_PRICE_PREMIUM_ANNUAL) return 'PREMIUM'
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return 'PRO'
  if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) return 'PRO'
  return 'FREE'
}

async function sincronizarAssinaturaOrg(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const organizationId = sub.metadata?.organizationId
  if (!organizationId) return

  const planoMeta = sub.metadata?.plano as PlanoOrgCodigo | undefined
  const status = mapearStatus(sub.status)
  const plano = (planoMeta ?? inferirPlanoOrgPorPriceId(sub)) as PlanoOrg
  const validaAte = new Date(sub.current_period_end * 1000)
  const priceId = sub.items.data[0]?.price.id
  const seats = sub.items.data[0]?.quantity ?? 1

  await prisma.assinaturaOrg.upsert({
    where: { stripeCustomerId: customerId },
    create: {
      organizationId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      plano,
      status,
      seatsContratadas: seats,
      iniciadaEm: new Date(sub.start_date * 1000),
      validaAte,
    },
    update: {
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      plano,
      status,
      seatsContratadas: seats,
      validaAte,
    },
  })

  // Atualiza Organization com plano e seats efetivos
  await prisma.organization.update({
    where: { id: organizationId },
    data: { plano, seats },
  })
}

function inferirPlanoOrgPorPriceId(sub: Stripe.Subscription): PlanoOrgCodigo {
  const priceId = sub.items.data[0]?.price.id
  if (!priceId) return 'STARTER'
  if (priceId === process.env.STRIPE_PRICE_ORG_GROWTH) return 'GROWTH'
  if (priceId === process.env.STRIPE_PRICE_ORG_STARTER) return 'STARTER'
  return 'STARTER'
}
