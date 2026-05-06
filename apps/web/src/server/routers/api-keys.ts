import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { gerarApiKey } from '../../lib/api-auth'
import { router, procedureProtegida } from '../trpc'

const procedureAdminOrg = procedureProtegida.use(async ({ ctx, next }) => {
  if (!ctx.user.organizationId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não pertence a uma organização' })
  }
  if (ctx.user.papelOrg !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem gerenciar chaves' })
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
})
