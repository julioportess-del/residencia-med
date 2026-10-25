import { calcularXp, progressoCinturao } from '@residencia-med/core'
import { router, procedureProtegida } from '../trpc'

/**
 * Nível (gamificação por cinturões). O XP é derivado on-demand das atividades
 * do candidato; a tabela Nivel só mantém cache leve do estado atual.
 *
 * Regras de cinturão agora são compostas: cada faixa exige XP mínimo + outros
 * marcos (dias ativos, taxa de acerto, simulados finalizados). Isso evita o
 * "farmei 500 XP em 1 dia e virei PRATA" que a lógica linear original permitia.
 */
export const nivelRouter = router({
  atual: procedureProtegida.query(async ({ ctx }) => {
    const userId = ctx.userId

    const [
      respostas,
      respostasCorretas,
      revisoes,
      flashcards,
      simuladosFinalizados,
      diasAtivosRows,
    ] = await Promise.all([
      ctx.prisma.resposta.count({ where: { userId } }),
      ctx.prisma.resposta.count({ where: { userId, correta: true } }),
      ctx.prisma.itemRevisao.count({ where: { userId, ultimaRevisao: { not: null } } }),
      ctx.prisma.revisaoFlashcard.count({ where: { flashcard: { userId } } }),
      ctx.prisma.sessao.count({
        where: { userId, tipo: 'SIMULADO', finalizadaEm: { not: null } },
      }),
      ctx.prisma.$queryRaw<Array<{ dias: bigint }>>`
          SELECT COUNT(DISTINCT DATE("createdAt"))::bigint AS dias
          FROM "Resposta"
          WHERE "userId" = ${userId}
        `,
    ])

    const diasAtivos = Number(diasAtivosRows[0]?.dias ?? 0n)
    const taxaAcerto = respostas > 0 ? respostasCorretas / respostas : 0

    const stats = {
      respostas,
      revisoes,
      flashcards,
      simuladosFinalizados,
      diasAtivos,
      taxaAcerto,
    }

    const xp = calcularXp(stats)
    const progresso = progressoCinturao(xp, stats)

    // Atualiza o cache no Nivel (sem bloquear a resposta)
    await ctx.prisma.nivel.upsert({
      where: { userId },
      create: { userId, cinturao: progresso.cinturao, xp },
      update: { cinturao: progresso.cinturao, xp },
    })

    return {
      ...progresso,
      atividades: {
        respostas,
        revisoes,
        flashcards,
        simuladosFinalizados,
        diasAtivos,
        taxaAcerto,
      },
    }
  }),
})
