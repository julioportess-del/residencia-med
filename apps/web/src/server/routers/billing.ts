import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { criarSessaoCheckout, criarSessaoPortal, obterPlanoUsuario } from '@residencia-med/billing'
import { router, procedureProtegida, procedurePublica } from '../trpc'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const billingRouter = router({
  meuPlano: procedureProtegida.query(async ({ ctx }) => {
    const plano = await obterPlanoUsuario(ctx.userId)
    const ass = await ctx.prisma.assinatura.findUnique({
      where: { userId: ctx.userId },
      select: {
        plano: true,
        status: true,
        validaAte: true,
        trialAte: true,
        canceladaEm: true,
        stripeSubscriptionId: true,
      },
    })
    return { plano, assinatura: ass }
  }),

  iniciarCheckout: procedureProtegida
    .input(
      z.object({
        plano: z.enum(['PRO', 'PREMIUM']),
        ciclo: z.enum(['monthly', 'annual']).default('monthly'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { url } = await criarSessaoCheckout({
          userId: ctx.userId,
          email: ctx.user.email,
          plano: input.plano,
          ciclo: input.ciclo,
          successUrl: `${APP_URL}/conta?checkout=sucesso`,
          cancelUrl: `${APP_URL}/precos?checkout=cancelado`,
        })
        return { url }
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: (e as Error).message,
        })
      }
    }),

  abrirPortal: procedureProtegida.mutation(async ({ ctx }) => {
    try {
      const { url } = await criarSessaoPortal(ctx.userId, `${APP_URL}/conta`)
      return { url }
    } catch (e) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: (e as Error).message,
      })
    }
  }),

  uso: procedureProtegida.query(async ({ ctx }) => {
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const [questoesMes, iaMes, simuladosSemana] = await Promise.all([
      ctx.prisma.resposta.count({
        where: { userId: ctx.userId, createdAt: { gte: inicioMes } },
      }),
      ctx.prisma.lLMCall.count({
        where: {
          userId: ctx.userId,
          funcao: 'explicarErro',
          cacheHit: false,
          status: 'sucesso',
          createdAt: { gte: inicioMes },
        },
      }),
      ctx.prisma.sessao.count({
        where: {
          userId: ctx.userId,
          tipo: 'SIMULADO',
          iniciadaEm: { gte: inicioSemana() },
        },
      }),
    ])
    return { questoesMes, iaMes, simuladosSemana }
  }),
})

function inicioSemana(): Date {
  const d = new Date()
  const dia = (d.getDay() + 6) % 7 // segunda=0
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - dia)
  return d
}

export const planosPublicosRouter = router({
  listar: procedurePublica.query(async () => {
    const { PLANOS_B2C } = await import('@residencia-med/billing')
    return PLANOS_B2C
  }),
})
