import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { startOfWeek, differenceInWeeks } from 'date-fns'
import { router, procedureProtegida } from '../trpc'

export const planoRouter = router({
  semanaAtual: procedureProtegida.query(async ({ ctx }) => {
    const plano = await ctx.prisma.planoEstudo.findUnique({
      where: { userId: ctx.userId },
    })
    if (!plano) return { plano: null, blocos: [] as Array<never> }

    const inicio = startOfWeek(plano.geradoEm, { weekStartsOn: 1 })
    const semanaAtual = Math.max(0, differenceInWeeks(new Date(), inicio))

    const blocos = await ctx.prisma.blocoEstudo.findMany({
      where: { planoId: plano.id, semana: semanaAtual },
      include: { tema: { select: { id: true, nome: true } } },
      orderBy: [{ diaSemana: 'asc' }, { ordem: 'asc' }],
    })

    return {
      plano: {
        id: plano.id,
        bancaAlvo: plano.bancaAlvo,
        dataProva: plano.dataProva,
        cargaHorariaSemanal: plano.cargaHorariaSemanal,
        semanaAtual,
        totalSemanas: Math.max(1, differenceInWeeks(plano.dataProva, inicio)),
      },
      blocos,
    }
  }),

  marcarBloco: procedureProtegida
    .input(
      z.object({
        blocoId: z.string().cuid(),
        status: z.enum(['CONCLUIDO', 'PULADO', 'PENDENTE']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const bloco = await ctx.prisma.blocoEstudo.findUnique({
        where: { id: input.blocoId },
        select: { plano: { select: { userId: true } } },
      })
      if (!bloco || bloco.plano.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      await ctx.prisma.blocoEstudo.update({
        where: { id: input.blocoId },
        data: {
          status: input.status,
          concluidoEm: input.status === 'CONCLUIDO' ? new Date() : null,
        },
      })
      return { ok: true }
    }),
})
