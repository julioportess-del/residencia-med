import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

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

const STATUS = z.enum(['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO'])

export const adminTicketsRouter = router({
  listar: procedureAdmin
    .input(
      z
        .object({
          status: STATUS.optional(),
          busca: z.string().trim().max(100).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const tickets = await ctx.prisma.ticket.findMany({
        where: {
          ...(input?.status ? { status: input.status } : {}),
          ...(input?.busca
            ? {
                OR: [
                  { titulo: { contains: input.busca, mode: 'insensitive' } },
                  { corpo: { contains: input.busca, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        take: 200,
        include: {
          user: { select: { email: true, name: true } },
          _count: { select: { respostas: true } },
        },
      })
      return tickets
    }),

  contagens: procedureAdmin.query(async ({ ctx }) => {
    const grupos = await ctx.prisma.ticket.groupBy({
      by: ['status'],
      _count: { _all: true },
    })
    const base: Record<'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'FECHADO', number> = {
      ABERTO: 0,
      EM_ANDAMENTO: 0,
      RESOLVIDO: 0,
      FECHADO: 0,
    }
    for (const g of grupos) {
      base[g.status] = g._count._all
    }
    return base
  }),

  obter: procedureAdmin.input(z.object({ id: z.string().cuid() })).query(async ({ ctx, input }) => {
    const ticket = await ctx.prisma.ticket.findUnique({
      where: { id: input.id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        respostas: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { name: true, email: true } } },
        },
      },
    })
    if (!ticket) throw new TRPCError({ code: 'NOT_FOUND' })
    return ticket
  }),

  responder: procedureAdmin
    .input(
      z.object({
        ticketId: z.string().cuid(),
        corpo: z.string().trim().min(1).max(5_000),
        novoStatus: STATUS.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.ticketId },
        select: { id: true, status: true },
      })
      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND' })

      const [resposta] = await ctx.prisma.$transaction([
        ctx.prisma.respostaTicket.create({
          data: {
            ticketId: input.ticketId,
            userId: ctx.userId,
            corpo: input.corpo,
            deEquipe: true,
          },
        }),
        ctx.prisma.ticket.update({
          where: { id: input.ticketId },
          data: {
            status:
              input.novoStatus ?? (ticket.status === 'ABERTO' ? 'EM_ANDAMENTO' : ticket.status),
          },
        }),
      ])
      return resposta
    }),

  alterarStatus: procedureAdmin
    .input(z.object({ id: z.string().cuid(), status: STATUS }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.ticket.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    }),
})
