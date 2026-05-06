import { router, procedureProtegida } from '../trpc'

export const revisaoRouter = router({
  itensVencidos: procedureProtegida.query(async ({ ctx }) => {
    const itens = await ctx.prisma.itemRevisao.findMany({
      where: {
        userId: ctx.userId,
        proximaRevisao: { lte: new Date() },
      },
      orderBy: { proximaRevisao: 'asc' },
      take: 50,
      include: {
        questao: {
          select: {
            id: true,
            enunciado: true,
            ano: true,
            dificuldade: true,
            banca: { select: { codigo: true, nome: true, cor: true } },
            temas: {
              where: { primario: true },
              select: { tema: { select: { id: true, nome: true } } },
              take: 1,
            },
          },
        },
      },
    })

    return itens.map((i) => ({
      id: i.id,
      questaoId: i.questaoId,
      proximaRevisao: i.proximaRevisao,
      repeticoes: i.repeticoes,
      intervalo: i.intervalo,
      questao: {
        id: i.questao.id,
        resumo: i.questao.enunciado.slice(0, 180),
        ano: i.questao.ano,
        dificuldade: i.questao.dificuldade,
        banca: i.questao.banca,
        tema: i.questao.temas[0]?.tema ?? null,
      },
    }))
  }),

  contagem: procedureProtegida.query(async ({ ctx }) => {
    const [vencidos, total] = await Promise.all([
      ctx.prisma.itemRevisao.count({
        where: { userId: ctx.userId, proximaRevisao: { lte: new Date() } },
      }),
      ctx.prisma.itemRevisao.count({ where: { userId: ctx.userId } }),
    ])
    return { vencidos, total }
  }),
})
