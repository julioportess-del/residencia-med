import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { gerarApiKey } from '../../lib/api-auth'
import { router, procedureProtegida } from '../trpc'

const procedureAdminOrg = procedureProtegida.use(async ({ ctx, next }) => {
  if (!ctx.user.organizationId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não pertence a uma organização' })
  }
  if (ctx.user.papelOrg !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Apenas administradores podem gerenciar chaves',
    })
  }
  return next({ ctx: { ...ctx, organizationId: ctx.user.organizationId } })
})

export const apiKeysRouter = router({
  listar: procedureAdminOrg.query(async ({ ctx }) => {
    return ctx.prisma.apiKey.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nome: true,
        prefixo: true,
        scopes: true,
        ultimoUsoEm: true,
        expiraEm: true,
        revogadaEm: true,
        createdAt: true,
        _count: { select: { usos: true } },
      },
    })
  }),

  criar: procedureAdminOrg
    .input(
      z.object({
        nome: z.string().min(2).max(100),
        scopes: z.array(z.string()).default(['read']),
        diasValidade: z.number().int().positive().max(365).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { plain, hash, prefixo } = gerarApiKey()
      const expiraEm = input.diasValidade
        ? new Date(Date.now() + input.diasValidade * 86_400_000)
        : null

      const chave = await ctx.prisma.apiKey.create({
        data: {
          organizationId: ctx.organizationId,
          nome: input.nome,
          hash,
          prefixo,
          scopes: input.scopes,
          expiraEm,
          criadoPor: ctx.userId,
        },
      })

      // Retorna a chave em plaintext UMA ÚNICA VEZ. Ela nunca mais é mostrada.
      return {
        id: chave.id,
        chave: plain,
        prefixo,
        nome: chave.nome,
        scopes: chave.scopes,
        expiraEm: chave.expiraEm,
        createdAt: chave.createdAt,
      }
    }),

  revogar: procedureAdminOrg
    .input(z.object({ apiKeyId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const k = await ctx.prisma.apiKey.findFirst({
        where: { id: input.apiKeyId, organizationId: ctx.organizationId },
      })
      if (!k) throw new TRPCError({ code: 'NOT_FOUND' })
      await ctx.prisma.apiKey.update({
        where: { id: input.apiKeyId },
        data: { revogadaEm: new Date() },
      })
      return { ok: true }
    }),

  usoRecente: procedureAdminOrg
    .input(z.object({ apiKeyId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.apiKeyUso.findMany({
        where: { apiKeyId: input.apiKeyId, apiKey: { organizationId: ctx.organizationId } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    }),

  estatisticas: procedureAdminOrg.query(async ({ ctx }) => {
    const inicio = new Date(Date.now() - 7 * 86_400_000)

    const [total, porDia, porRota, porStatus] = await Promise.all([
      ctx.prisma.apiKeyUso.count({
        where: {
          apiKey: { organizationId: ctx.organizationId },
          createdAt: { gte: inicio },
        },
      }),
      ctx.prisma.$queryRawUnsafe<Array<{ dia: string; total: bigint; latencia_p50: number }>>(
        `SELECT to_char(date_trunc('day', u."createdAt"), 'YYYY-MM-DD') as dia,
                count(*)::bigint as total,
                percentile_cont(0.5) within group (order by u."latenciaMs") as latencia_p50
         FROM "ApiKeyUso" u
         JOIN "ApiKey" k ON k.id = u."apiKeyId"
         WHERE k."organizationId" = $1 AND u."createdAt" >= $2
         GROUP BY 1
         ORDER BY 1`,
        ctx.organizationId,
        inicio,
      ),
      ctx.prisma.apiKeyUso.groupBy({
        by: ['rota'],
        where: {
          apiKey: { organizationId: ctx.organizationId },
          createdAt: { gte: inicio },
        },
        _count: { _all: true },
        _avg: { latenciaMs: true },
        orderBy: { _count: { rota: 'desc' } },
        take: 10,
      }),
      ctx.prisma.apiKeyUso.groupBy({
        by: ['status'],
        where: {
          apiKey: { organizationId: ctx.organizationId },
          createdAt: { gte: inicio },
        },
        _count: { _all: true },
      }),
    ])

    return {
      janela: '7d',
      totalChamadas: total,
      porDia: porDia.map((d) => ({
        dia: d.dia,
        total: Number(d.total),
        latenciaP50: Math.round(d.latencia_p50 ?? 0),
      })),
      porRota: porRota.map((r) => ({
        rota: r.rota,
        total: r._count._all,
        latenciaMedia: Math.round(r._avg.latenciaMs ?? 0),
      })),
      porStatus: porStatus.map((s) => ({ status: s.status, total: s._count._all })),
    }
  }),
})
