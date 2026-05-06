import { differenceInDays, startOfDay, subDays } from 'date-fns'
import { router, procedureProtegida } from '../trpc'

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
      const dia = startOfDay(subDays(new Date(), 6 - i)).toISOString().slice(0, 10)
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
