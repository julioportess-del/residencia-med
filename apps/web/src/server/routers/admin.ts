import { TRPCError } from '@trpc/server'
import { subDays, startOfMonth, startOfDay } from 'date-fns'
import { router, procedureProtegida } from '../trpc'
import { PLANOS_B2C, PLANOS_B2B } from '@residencia-med/billing'

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

  /**
   * Painel executivo agregado (B2C + B2B + IA + crescimento).
   */
  execResumo: procedureAdmin.query(async ({ ctx }) => {
    const ha7d = subDays(new Date(), 7)
    const ha30d = subDays(new Date(), 30)
    const ha60d = subDays(new Date(), 60)
    const inicioHoje = startOfDay(new Date())
    const inicioMes = startOfMonth(new Date())

    const [
      usuariosTotal,
      usuariosNovos7d,
      usuariosNovos30d,
      usuariosNovos60a30d,
      usuariosAtivos7d,
      usuariosAtivos30d,
      assinaturasB2C,
      assinaturasB2B,
      orgsTotal,
      orgsAtivas,
      llmMes,
      llmHoje,
      respostasMes,
      simuladosMes,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.user.count({ where: { createdAt: { gte: ha7d } } }),
      ctx.prisma.user.count({ where: { createdAt: { gte: ha30d } } }),
      ctx.prisma.user.count({
        where: { createdAt: { gte: ha60d, lt: ha30d } },
      }),
      ctx.prisma.user.count({
        where: { respostas: { some: { createdAt: { gte: ha7d } } } },
      }),
      ctx.prisma.user.count({
        where: { respostas: { some: { createdAt: { gte: ha30d } } } },
      }),
      ctx.prisma.assinatura.findMany({
        where: { status: { in: ['ATIVA', 'TRIAL'] } },
        select: { plano: true, status: true },
      }),
      ctx.prisma.assinaturaOrg.findMany({
        where: { status: { in: ['ATIVA', 'TRIAL'] } },
        select: {
          plano: true,
          status: true,
          seatsContratadas: true,
          organizationId: true,
          organization: { select: { id: true, name: true } },
        },
      }),
      ctx.prisma.organization.count(),
      ctx.prisma.organization.count({
        where: { assinatura: { status: { in: ['ATIVA', 'TRIAL'] } } },
      }),
      ctx.prisma.lLMCall.aggregate({
        where: { createdAt: { gte: inicioMes }, status: 'sucesso' },
        _sum: { custoUsd: true, inputTokens: true, outputTokens: true },
        _count: { _all: true },
      }),
      ctx.prisma.lLMCall.aggregate({
        where: { createdAt: { gte: inicioHoje }, status: 'sucesso' },
        _sum: { custoUsd: true },
        _count: { _all: true },
      }),
      ctx.prisma.resposta.count({ where: { createdAt: { gte: inicioMes } } }),
      ctx.prisma.sessao.count({
        where: { tipo: 'SIMULADO', iniciadaEm: { gte: inicioMes } },
      }),
    ])

    const mrrB2C = assinaturasB2C.reduce<number>((acc, a) => {
      const def = PLANOS_B2C[a.plano as 'FREE' | 'PRO' | 'PREMIUM']
      return acc + (def?.precoMensalCentavos ?? 0)
    }, 0)

    const mrrB2B = assinaturasB2B.reduce<number>((acc, a) => {
      const def = PLANOS_B2B[a.plano as 'STARTER' | 'GROWTH' | 'ENTERPRISE']
      if (!def) return acc
      const seatsExtras = Math.max(0, a.seatsContratadas - def.seatsIncluidos)
      return acc + def.precoMensalCentavos + seatsExtras * def.seatAdicionalCentavos
    }, 0)

    const distribuicaoB2C: Record<string, number> = {}
    for (const a of assinaturasB2C) {
      distribuicaoB2C[a.plano] = (distribuicaoB2C[a.plano] ?? 0) + 1
    }

    const distribuicaoB2B: Record<string, number> = {}
    for (const a of assinaturasB2B) {
      distribuicaoB2B[a.plano] = (distribuicaoB2B[a.plano] ?? 0) + 1
    }

    const topOrgsMrr = assinaturasB2B
      .map((a) => {
        const def = PLANOS_B2B[a.plano as 'STARTER' | 'GROWTH' | 'ENTERPRISE']
        const seatsExtras = def ? Math.max(0, a.seatsContratadas - def.seatsIncluidos) : 0
        const mrrCentavos =
          (def?.precoMensalCentavos ?? 0) + seatsExtras * (def?.seatAdicionalCentavos ?? 0)
        return {
          orgId: a.organizationId,
          nome: a.organization?.name ?? 'Sem nome',
          plano: a.plano,
          seats: a.seatsContratadas,
          mrrCentavos,
        }
      })
      .sort((a, b) => b.mrrCentavos - a.mrrCentavos)
      .slice(0, 10)

    const crescimentoUsuarios =
      usuariosNovos60a30d > 0
        ? ((usuariosNovos30d - usuariosNovos60a30d) / usuariosNovos60a30d) * 100
        : usuariosNovos30d > 0
          ? 100
          : 0

    return {
      usuarios: {
        total: usuariosTotal,
        novos7d: usuariosNovos7d,
        novos30d: usuariosNovos30d,
        ativos7d: usuariosAtivos7d,
        ativos30d: usuariosAtivos30d,
        crescimentoPct: Math.round(crescimentoUsuarios * 10) / 10,
      },
      receita: {
        mrrB2CCentavos: mrrB2C,
        mrrB2BCentavos: mrrB2B,
        mrrTotalCentavos: mrrB2C + mrrB2B,
        arrCentavos: (mrrB2C + mrrB2B) * 12,
      },
      planos: {
        b2c: distribuicaoB2C,
        b2b: distribuicaoB2B,
      },
      orgs: {
        total: orgsTotal,
        ativas: orgsAtivas,
        topMrr: topOrgsMrr,
      },
      ia: {
        chamadasMes: llmMes._count._all,
        custoMesUsd: llmMes._sum.custoUsd ?? 0,
        chamadasHoje: llmHoje._count._all,
        custoHojeUsd: llmHoje._sum.custoUsd ?? 0,
        inputTokensMes: llmMes._sum.inputTokens ?? 0,
        outputTokensMes: llmMes._sum.outputTokens ?? 0,
      },
      atividade: {
        respostasMes,
        simuladosMes,
      },
    }
  }),
})
