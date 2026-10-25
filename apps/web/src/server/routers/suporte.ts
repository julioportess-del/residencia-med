import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

export const suporteRouter = router({
  meus: procedureProtegida.query(async ({ ctx }) => {
    const tickets = await ctx.prisma.ticket.findMany({
      where: { userId: ctx.userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { respostas: true } } },
    })
    return tickets
  }),

  obter: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: {
          respostas: {
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { name: true, email: true } } },
          },
        },
      })
      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND' })
      return ticket
    }),

  criar: procedureProtegida
    .input(
      z.object({
        titulo: z.string().trim().min(3).max(200),
        corpo: z.string().trim().min(10).max(10_000),
        categoria: z
          .string()
          .trim()
          .max(60)
          .transform((s) => (s === '' ? null : s))
          .nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.ticket.create({
        data: {
          userId: ctx.userId,
          titulo: input.titulo,
          corpo: input.corpo,
          categoria: input.categoria,
        },
      })
    }),

  responder: procedureProtegida
    .input(
      z.object({
        ticketId: z.string().cuid(),
        corpo: z.string().trim().min(1).max(5_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verifica se o ticket pertence ao user (sem permitir resposta cruzada)
      const ticket = await ctx.prisma.ticket.findFirst({
        where: { id: input.ticketId, userId: ctx.userId },
      })
      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.prisma.respostaTicket.create({
        data: { ticketId: input.ticketId, userId: ctx.userId, corpo: input.corpo, deEquipe: false },
      })
    }),
})
