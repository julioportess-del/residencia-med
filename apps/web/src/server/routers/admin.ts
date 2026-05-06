import { TRPCError } from '@trpc/server'
import { subDays, startOfMonth } from 'date-fns'
import { router, procedureProtegida } from '../trpc'
import { PLANOS_B2C } from '@residencia-med/billing'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

const procedureAdmin = procedureProtegida.use(async ({ ctx, next }) => {
  if (!ADMIN_EMAILS.includes(ctx.user.email.toLowerCase())) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito' })
  }
  return next()
})

export const adminRouter = router({
  resumo: procedureAdmin.query(async ({ ctx }) => {
    const inicioMes = startOfMonth(new Date())
    const ha30d = subDays(new Date(), 30)

    const [usuariosTotal, usuariosAtivos30d, assinaturas, ll30d] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.user.count({
        where: { respostas: { some: { createdAt: { gte: ha30d } } } },
      }),
      ctx.prisma.assinatura.findMany({
        where: { status: { in: ['ATIVA', 'TRIAL'] } },
        select: { plano: true, status: true },
      }),
      ctx.prisma.lLMCall.aggregate({
        where: { createdAt: { gte: ha30d }, status: 'sucesso' },
        _sum: { custoUsd: true, inputTokens: true, outputTokens: true },
        _count: { _all: true },
      }),
    ])

    const mrr = assinaturas.reduce((acc, a) => {
      const def = PLANOS_B2C[a.plano as 'FREE' | 'PRO' | 'PREMIUM']
      return acc + (def?.precoMensalCentavos ?? 0)
    }, 0)

    const distribuicaoPlanos = assinaturas.reduce<Record<string, number>>((acc, a) => {
      acc[a.plano] = (acc[a.plano] ?? 0) + 1
      return acc
    }, {})

    void inicioMes
    return {
      usuariosTotal,
      usuariosAtivos30d,
      mrrCentavos: mrr,
      distribuicaoPlanos,
      iaUltimos30d: {
        chamadas: ll30d._count._all,
        custoUsd: ll30d._sum.custoUsd ?? 0,
        inputTokens: ll30d._sum.inputTokens ?? 0,
        outputTokens: ll30d._sum.outputTokens ?? 0,
      },
    }
  }),

  usuariosTopIA: procedureAdmin.query(async ({ ctx }) => {
    const ha30d = subDays(new Date(), 30)
    const grupos = await ctx.prisma.lLMCall.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: ha30d }, userId: { not: null } },
      _sum: { custoUsd: true },
      _count: { _all: true },
      orderBy: { _sum: { custoUsd: 'desc' } },
      take: 20,
    })

    const userIds = grupos.map((g) => g.userId).filter((id): id is string => Boolean(id))
    const users = await ctx.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    })

    return grupos.map((g) => {
      const u = users.find((x) => x.id === g.userId)
      return {
        userId: g.userId,
        email: u?.email ?? '?',
        nome: u?.name ?? null,
        custoUsd: g._sum.custoUsd ?? 0,
        chamadas: g._count._all,
      }
    })
  }),
})
