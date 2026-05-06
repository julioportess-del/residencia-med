import { calcularProficiencia, type RespostaParaProficiencia } from '@residencia-med/core'
import type { Dificuldade } from '@residencia-med/types'
import { router, procedureProtegida } from '../trpc'

export const proficienciaRouter = router({
  /**
   * Calcula proficiência on-demand a partir das respostas do usuário.
   * Cache em Proficiencia.atualizadoEm — reusa se < 30min.
   */
  atual: procedureProtegida.query(async ({ ctx }) => {
    const cache = await ctx.prisma.proficiencia.findUnique({
      where: { userId: ctx.userId },
    })
    const idade = cache ? Date.now() - cache.atualizadoEm.getTime() : Infinity
    if (cache && idade < 30 * 60_000) {
      return {
        scoreGlobal: cache.scoreGlobal,
        totalRespostas: cache.totalRespostas,
        porEspecialidade:
          (cache.porEspecialidadeJson as unknown as ReturnType<
            typeof calcularProficiencia
          >['porEspecialidade']) ?? [],
        atualizadoEm: cache.atualizadoEm,
      }
    }

    const respostas = await ctx.prisma.resposta.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
      take: 2000,
      select: {
        correta: true,
        questao: {
          select: {
            dificuldade: true,
            temas: {
              where: { primario: true },
              select: {
                tema: {
                  select: {
                    especialidadeId: true,
                    especialidade: { select: { nome: true } },
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    })

    const dadosCalc: RespostaParaProficiencia[] = respostas
      .map((r) => {
        const t = r.questao.temas[0]?.tema
        if (!t) return null
        return {
          correta: r.correta,
          dificuldade: r.questao.dificuldade as Dificuldade,
          especialidadeId: t.especialidadeId,
          especialidadeNome: t.especialidade.nome,
        }
      })
      .filter((x): x is RespostaParaProficiencia => x !== null)

    const resultado = calcularProficiencia(dadosCalc)

    // Persiste cache (best-effort)
    void ctx.prisma.proficiencia
      .upsert({
        where: { userId: ctx.userId },
        create: {
          userId: ctx.userId,
          scoreGlobal: resultado.scoreGlobal,
          totalRespostas: resultado.totalRespostas,
          porEspecialidadeJson: resultado.porEspecialidade as never,
          atualizadoEm: new Date(),
        },
        update: {
          scoreGlobal: resultado.scoreGlobal,
          totalRespostas: resultado.totalRespostas,
          porEspecialidadeJson: resultado.porEspecialidade as never,
          atualizadoEm: new Date(),
        },
      })
      .catch(() => {})

    return {
      scoreGlobal: resultado.scoreGlobal,
      totalRespostas: resultado.totalRespostas,
      porEspecialidade: resultado.porEspecialidade,
      atualizadoEm: new Date(),
    }
  }),
})
