import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

/**
 * Vigília é um monitor LOCAL de atenção (webcam no navegador do aluno).
 * O backend não vê frame nem feature biométrica — guarda só duração por
 * sessão. Isso é opt-in e os prompts da UI deixam explícito que o único
 * dado persistido é tempo.
 */
export const vigiliaRouter = router({
  iniciar: procedureProtegida
    .input(z.object({ aulaId: z.string().cuid().optional() }))
    .mutation(async ({ ctx, input }) => {
      const sessao = await ctx.prisma.sessaoVigilia.create({
        data: {
          userId: ctx.userId,
          aulaId: input.aulaId ?? null,
        },
        select: { id: true },
      })
      return sessao
    }),

  encerrar: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const sessao = await ctx.prisma.sessaoVigilia.findUnique({
        where: { id: input.id },
        select: { userId: true, iniciadaEm: true, encerradaEm: true },
      })
      if (!sessao) throw new TRPCError({ code: 'NOT_FOUND' })
      if (sessao.userId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' })
      // Idempotente: se já encerrou, não altera.
      if (sessao.encerradaEm) return { ok: true, jaEncerrada: true }

      const agora = new Date()
      const duracao = Math.max(
        0,
        Math.round((agora.getTime() - sessao.iniciadaEm.getTime()) / 1000),
      )
      await ctx.prisma.sessaoVigilia.update({
        where: { id: input.id },
        data: { encerradaEm: agora, duracaoSegundos: duracao },
      })
      return { ok: true, duracaoSegundos: duracao }
    }),

  resumo: procedureProtegida.query(async ({ ctx }) => {
    const agora = new Date()
    const inicioSemana = new Date(agora)
    inicioSemana.setDate(agora.getDate() - 7)

    const [acumuladoSemana, acumuladoTotal, ultimas] = await Promise.all([
      ctx.prisma.sessaoVigilia.aggregate({
        where: { userId: ctx.userId, iniciadaEm: { gte: inicioSemana } },
        _sum: { duracaoSegundos: true },
      }),
      ctx.prisma.sessaoVigilia.aggregate({
        where: { userId: ctx.userId },
        _sum: { duracaoSegundos: true },
        _count: true,
      }),
      ctx.prisma.sessaoVigilia.findMany({
        where: { userId: ctx.userId, encerradaEm: { not: null } },
        orderBy: { iniciadaEm: 'desc' },
        take: 5,
        select: {
          id: true,
          iniciadaEm: true,
          duracaoSegundos: true,
          aulaId: true,
        },
      }),
    ])

    return {
      segundosSemana: acumuladoSemana._sum.duracaoSegundos ?? 0,
      segundosTotal: acumuladoTotal._sum.duracaoSegundos ?? 0,
      totalSessoes: acumuladoTotal._count,
      ultimas,
    }
  }),
})
