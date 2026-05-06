import { prisma } from '@residencia-med/db'
import { stripe } from './stripe'
import { precoIdEnv, precoIdEnvOrg, type PlanoCodigo, type PlanoOrgCodigo } from './plans'

export type CriarCheckoutInput = {
  userId: string
  email: string
  plano: Exclude<PlanoCodigo, 'FREE'>
  ciclo: 'monthly' | 'annual'
  successUrl: string
  cancelUrl: string
}

export async function criarSessaoCheckout(input: CriarCheckoutInput): Promise<{ url: string }> {
  const priceId = precoIdEnv(input.plano, input.ciclo)
  if (!priceId) {
    throw new Error(`Price ID nao configurado para ${input.plano}/${input.ciclo}`)
  }

  let assinatura = await prisma.assinatura.findUnique({
    where: { userId: input.userId },
  })

  let stripeCustomerId = assinatura?.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe().customers.create({
      email: input.email,
      metadata: { userId: input.userId },
    })
    stripeCustomerId = customer.id
    if (!assinatura) {
      assinatura = await prisma.assinatura.create({
        data: {
          userId: input.userId,
          stripeCustomerId,
          plano: 'FREE',
          status: 'TRIAL',
        },
      })
    } else {
      await prisma.assinatura.update({
        where: { userId: input.userId },
        data: { stripeCustomerId },
      })
    }
  }

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId: input.userId, plano: input.plano },
      trial_period_days: 7,
    },
    metadata: { userId: input.userId, plano: input.plano, ciclo: input.ciclo },
  })

  if (!session.url) throw new Error('Stripe nao retornou URL de checkout')
  return { url: session.url }
}

export async function criarSessaoPortal(
  userId: string,
  returnUrl: string,
): Promise<{ url: string }> {
  const assinatura = await prisma.assinatura.findUnique({
    where: { userId },
  })
  if (!assinatura?.stripeCustomerId) {
    throw new Error('Usuario sem cliente Stripe — assine primeiro')
  }
  const portal = await stripe().billingPortal.sessions.create({
    customer: assinatura.stripeCustomerId,
    return_url: returnUrl,
  })
  return { url: portal.url }
}

// ==================== B2B ====================

export type CriarCheckoutOrgInput = {
  organizationId: string
  emailFaturamento: string
  plano: Exclude<PlanoOrgCodigo, 'ENTERPRISE'>
  seats: number
  successUrl: string
  cancelUrl: string
}

export async function criarSessaoCheckoutOrg(
  input: CriarCheckoutOrgInput,
): Promise<{ url: string }> {
  const priceId = precoIdEnvOrg(input.plano)
  if (!priceId) {
    throw new Error(`Price ID Stripe não configurado para org ${input.plano}`)
  }

  let assinatura = await prisma.assinaturaOrg.findUnique({
    where: { organizationId: input.organizationId },
  })

  let stripeCustomerId = assinatura?.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe().customers.create({
      email: input.emailFaturamento,
      metadata: { organizationId: input.organizationId, tipo: 'org' },
    })
    stripeCustomerId = customer.id
    if (!assinatura) {
      assinatura = await prisma.assinaturaOrg.create({
        data: {
          organizationId: input.organizationId,
          stripeCustomerId,
          plano: 'STARTER',
          status: 'TRIAL',
          seatsContratadas: input.seats,
        },
      })
    } else {
      await prisma.assinaturaOrg.update({
        where: { organizationId: input.organizationId },
        data: { stripeCustomerId },
      })
    }
  }

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: input.seats }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: {
        organizationId: input.organizationId,
        plano: input.plano,
        tipo: 'org',
      },
      trial_period_days: 14,
    },
    metadata: {
      organizationId: input.organizationId,
      plano: input.plano,
      tipo: 'org',
    },
  })

  if (!session.url) throw new Error('Stripe não retornou URL de checkout')
  return { url: session.url }
}

export async function criarSessaoPortalOrg(
  organizationId: string,
  returnUrl: string,
): Promise<{ url: string }> {
  const assinatura = await prisma.assinaturaOrg.findUnique({
    where: { organizationId },
  })
  if (!assinatura?.stripeCustomerId) {
    throw new Error('Organização sem cliente Stripe — assine primeiro')
  }
  const portal = await stripe().billingPortal.sessions.create({
    customer: assinatura.stripeCustomerId,
    return_url: returnUrl,
  })
  return { url: portal.url }
}
