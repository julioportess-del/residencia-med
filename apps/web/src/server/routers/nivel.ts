import { calcularXp, progressoCinturao } from '@residencia-med/core'
import { router, procedureProtegida } from '../trpc'

/**
 * Nível (gamificação por cinturões). O XP é derivado on-demand das atividades
 * do candidato; a tabela Nivel só mantém cache leve do estado atual.
 */
export const nivelRouter = router({
  atual: procedureProtegida.query(async ({ ctx }) => {
    const userId = ctx.userId

    const [respostas, revisoes, flashcards, simuladosFinalizados] = await Promise.all([
      ctx.prisma.resposta.count({ where: { userId } }),
      ctx.prisma.itemRevisao.count({ where: { userId, ultimaRevisao: { not: null } } }),
      ctx.prisma.revisaoFlashcard.count({ where: { flashcard: { userId } } }),
      ctx.prisma.sessao.count({
        where: { userId, tipo: 'SIMULADO', finalizadaEm: { not: null } },
      }),
    ])

    const xp = calcularXp({ respostas, revisoes, flashcards, simuladosFinalizados })
    const progresso = progressoCinturao(xp)

    // Atualiza o cache no Nivel (sem bloquear a resposta)
    await ctx.prisma.nivel.upsert({
      where: { userId },
      create: { userId, cinturao: progresso.cinturao, xp },
      update: { cinturao: progresso.cinturao, xp },
    })

    return {
      ...progresso,
      atividades: { respostas, revisoes, flashcards, simuladosFinalizados },
    }
  }),
})
