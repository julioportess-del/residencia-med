import { differenceInDays, startOfDay, subDays } from 'date-fns'
import { router, procedureProtegida } from '../trpc'

export type ComparacaoParesOutput = null | {
  bancaAlvo: string
  totalPares: number
  minhaTaxa: number | null
  mediaPares: number | null
  percentil: number | null
  quartis: { p10: number; p25: number; p50: number; p75: number; p90: number } | null
}

export const dashboardRouter = router({
  resumo: procedureProtegida.query(async ({ ctx }) => {
    const userId = ctx.userId

    const [totalRespostas, totalAcertos, sessoes30d, respostas7d] = await Promise.all([
      ctx.prisma.resposta.count({ where: { userId } }),
      ctx.prisma.resposta.count({ where: { userId, correta: true } }),
      ctx.prisma.sessao.count({
        where: { userId, iniciadaEm: { gte: subDays(new Date(), 30) } },
      }),
      ctx.prisma.resposta.findMany({
        where: { userId, createdAt: { gte: subDays(new Date(), 7) } },
        select: { createdAt: true, correta: true },
      }),
    ])

    const tx = totalRespostas > 0 ? totalAcertos / totalRespostas : 0
    const streak = await calcularStreak(ctx.prisma, userId)

    const porDia = new Map<string, { total: number; acertos: number }>()
    for (const r of respostas7d) {
      const dia = startOfDay(r.createdAt).toISOString().slice(0, 10)
      const ent = porDia.get(dia) ?? { total: 0, acertos: 0 }
      ent.total++
      if (r.correta) ent.acertos++
      porDia.set(dia, ent)
    }
    const ultimos7 = Array.from({ length: 7 }, (_, i) => {
      const dia = startOfDay(subDays(new Date(), 6 - i))
        .toISOString()
        .slice(0, 10)
      const v = porDia.get(dia) ?? { total: 0, acertos: 0 }
      return { dia, total: v.total, acertos: v.acertos }
    })

    return {
      totalRespostas,
      totalAcertos,
      taxaAcerto: tx,
      sessoes30d,
      streak,
      ultimos7,
    }
  }),

  porEspecialidade: procedureProtegida.query(async ({ ctx }) => {
    const userId = ctx.userId

    const respostas = await ctx.prisma.resposta.findMany({
      where: { userId },
      select: {
        correta: true,
        questao: {
          select: {
            temas: {
              where: { primario: true },
              select: {
                tema: {
                  select: {
                    especialidadeId: true,
                    especialidade: { select: { nome: true, cor: true } },
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    })

    const porEsp = new Map<
      string,
      { total: number; acertos: number; nome: string; cor: string | null }
    >()
    for (const r of respostas) {
      const esp = r.questao.temas[0]?.tema
      if (!esp) continue
      const key = esp.especialidadeId
      const ent = porEsp.get(key) ?? {
        total: 0,
        acertos: 0,
        nome: esp.especialidade.nome,
        cor: esp.especialidade.cor,
      }
      ent.total++
      if (r.correta) ent.acertos++
      porEsp.set(key, ent)
    }

    return Array.from(porEsp.values())
      .map((v) => ({
        nome: v.nome,
        cor: v.cor,
        total: v.total,
        acertos: v.acertos,
        taxa: v.total > 0 ? v.acertos / v.total : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }),

  pontosFortesEFracos: procedureProtegida.query(async ({ ctx }) => {
    const userId = ctx.userId

    const respostas = await ctx.prisma.resposta.findMany({
      where: { userId },
      select: {
        correta: true,
        questao: {
          select: {
            temas: {
              where: { primario: true },
              select: { tema: { select: { id: true, nome: true } } },
              take: 1,
            },
          },
        },
      },
    })

    const porTema = new Map<string, { total: number; acertos: number; nome: string }>()
    for (const r of respostas) {
      const t = r.questao.temas[0]?.tema
      if (!t) continue
      const ent = porTema.get(t.id) ?? { total: 0, acertos: 0, nome: t.nome }
      ent.total++
      if (r.correta) ent.acertos++
      porTema.set(t.id, ent)
    }

    const lista = Array.from(porTema.entries())
      .filter(([, v]) => v.total >= 3)
      .map(([id, v]) => ({ id, nome: v.nome, total: v.total, taxa: v.acertos / v.total }))

    const fortes = [...lista].sort((a, b) => b.taxa - a.taxa).slice(0, 5)
    const fracos = [...lista].sort((a, b) => a.taxa - b.taxa).slice(0, 5)

    return { fortes, fracos }
  }),

  /**
   * Compara o usuário atual com os demais que estudam a mesma banca-alvo.
   * Retorna percentil + anonimato (apenas distribuição, nenhum email).
   * Mínimo de 5 outros usuários para preservar privacidade.
   */
  comparacaoPares: procedureProtegida.query(async ({ ctx }): Promise<ComparacaoParesOutput> => {
    const userId = ctx.userId
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { metaResidencia: true, dataProva: true },
    })
    if (!user?.metaResidencia) return null

    // Busca usuários com mesma banca alvo
    const pares = await ctx.prisma.user.findMany({
      where: {
        metaResidencia: user.metaResidencia,
        id: { not: userId },
      },
      select: {
        id: true,
        respostas: {
          select: { correta: true },
          take: 500,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const taxas = pares
      .map((p) => {
        const total = p.respostas.length
        if (total < 20) return null
        const ac = p.respostas.filter((r) => r.correta).length
        return ac / total
      })
      .filter((t): t is number => t !== null)

    if (taxas.length < 5) {
      return {
        bancaAlvo: user.metaResidencia,
        totalPares: taxas.length,
        minhaTaxa: null,
        mediaPares: null,
        percentil: null,
        quartis: null,
      }
    }

    // Taxa do usuário atual
    const minhasRespostas = await ctx.prisma.resposta.findMany({
      where: { userId },
      select: { correta: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    if (minhasRespostas.length < 10) {
      return {
        bancaAlvo: user.metaResidencia,
        totalPares: taxas.length,
        minhaTaxa: null,
        mediaPares: null,
        percentil: null,
        quartis: null,
      }
    }
    const minhaTaxa = minhasRespostas.filter((r) => r.correta).length / minhasRespostas.length

    const ordenadas = [...taxas].sort((a, b) => a - b)
    const piores = ordenadas.filter((t) => t < minhaTaxa).length
    const percentil = Math.round((piores / ordenadas.length) * 100)

    const q = (p: number) =>
      ordenadas[Math.min(ordenadas.length - 1, Math.floor((p / 100) * ordenadas.length))] ?? 0

    return {
      bancaAlvo: user.metaResidencia,
      totalPares: ordenadas.length,
      minhaTaxa,
      mediaPares: ordenadas.reduce((a, b) => a + b, 0) / ordenadas.length,
      percentil,
      quartis: {
        p10: q(10),
        p25: q(25),
        p50: q(50),
        p75: q(75),
        p90: q(90),
      },
    }
  }),
})

async function calcularStreak(
  prisma: typeof import('@residencia-med/db').prisma,
  userId: string,
): Promise<number> {
  const respostas = await prisma.resposta.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  if (respostas.length === 0) return 0
  const dias = new Set(respostas.map((r) => startOfDay(r.createdAt).toISOString().slice(0, 10)))
  let streak = 0
  let cursor = startOfDay(new Date())
  while (dias.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor = subDays(cursor, 1)
  }
  if (streak === 0) {
    const ontem = subDays(startOfDay(new Date()), 1).toISOString().slice(0, 10)
    if (dias.has(ontem)) {
      void differenceInDays
    }
  }
  return streak
}
