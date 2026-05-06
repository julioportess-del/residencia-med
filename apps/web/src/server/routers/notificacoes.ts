import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

export const notificacoesRouter = router({
  listar: procedureProtegida
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }).default({}))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.notificacao.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        take: input.limit ?? 20,
      })
    }),

  unreadCount: procedureProtegida.query(async ({ ctx }) => {
    return ctx.prisma.notificacao.count({
      where: { userId: ctx.userId, lidaEm: null },
    })
  }),

  marcarLida: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notificacao.updateMany({
        where: { id: input.id, userId: ctx.userId, lidaEm: null },
        data: { lidaEm: new Date() },
      })
      return { ok: true }
    }),

  marcarTodasLidas: procedureProtegida.mutation(async ({ ctx }) => {
    await ctx.prisma.notificacao.updateMany({
      where: { userId: ctx.userId, lidaEm: null },
      data: { lidaEm: new Date() },
    })
    return { ok: true }
  }),

  excluir: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notificacao.deleteMany({
        where: { id: input.id, userId: ctx.userId },
      })
      return { ok: true }
    }),
})
