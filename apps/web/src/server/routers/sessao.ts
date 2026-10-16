import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { CriarSessaoInput } from '@residencia-med/types'
import { checarLimiteSimulados } from '@residencia-med/billing'
import { router, procedureProtegida } from '../trpc'

export const sessaoRouter = router({
  criar: procedureProtegida.input(CriarSessaoInput).mutation(async ({ ctx, input }) => {
    if (input.tipo === 'SIMULADO') {
      const limite = await checarLimiteSimulados(ctx.userId)
      if (!limite.permitido) {
        throw new TRPCError({ code: 'FORBIDDEN', message: limite.motivo ?? 'Limite atingido' })
      }
    }

    const where = {
      publicada: true,
      ...(input.filtros.bancaIds?.length ? { bancaId: { in: input.filtros.bancaIds } } : {}),
      ...(input.filtros.dificuldades?.length
        ? { dificuldade: { in: input.filtros.dificuldades } }
        : {}),
      ...(input.filtros.anos?.length ? { ano: { in: input.filtros.anos } } : {}),
      ...(input.filtros.temaIds?.length
        ? { temas: { some: { temaId: { in: input.filtros.temaIds } } } }
        : {}),
    }

    const total = await ctx.prisma.questao.count({ where })
    if (total === 0)
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhuma questao com esses filtros' })

    const candidatas = await ctx.prisma.questao.findMany({
      where,
      take: Math.min(input.numeroQuestoes * 3, 300),
      select: { id: true },
    })
    const embaralhadas = candidatas.sort(() => Math.random() - 0.5).slice(0, input.numeroQuestoes)

    const sessao = await ctx.prisma.sessao.create({
      data: {
        userId: ctx.userId,
        tipo: input.tipo,
        bancaId: input.bancaId,
        configuracao: {
          filtros: input.filtros,
          questaoIds: embaralhadas.map((q) => q.id),
          tempoMinutos: input.tempoMinutos,
          numeroQuestoes: input.numeroQuestoes,
        },
      },
    })

    return { sessaoId: sessao.id, questaoIds: embaralhadas.map((q) => q.id) }
  }),

  detalhe: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const sessao = await ctx.prisma.sessao.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: {
          respostas: {
            include: {
              questao: {
                select: {
                  id: true,
                  enunciado: true,
                  gabaritoLetra: true,
                  banca: { select: { codigo: true, nome: true } },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })
      if (!sessao) throw new TRPCError({ code: 'NOT_FOUND' })
      return sessao
    }),

  finalizar: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const dono = await ctx.prisma.sessao.findFirst({
        where: { id: input.id, userId: ctx.userId },
        select: { id: true },
      })
      if (!dono) throw new TRPCError({ code: 'NOT_FOUND' })
      const sessao = await ctx.prisma.sessao.update({
        where: { id: input.id },
        data: { finalizadaEm: new Date() },
        include: {
          respostas: {
            include: {
              questao: {
                select: {
                  dificuldade: true,
                  temas: {
                    where: { primario: true },
                    select: {
                      tema: {
                        select: {
                          id: true,
                          nome: true,
                          especialidade: { select: { nome: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      const porEspecialidade = new Map<string, { total: number; acertos: number }>()
      const porDificuldade: Record<string, { total: number; acertos: number }> = {}

      for (const r of sessao.respostas) {
        const esp = r.questao.temas[0]?.tema.especialidade.nome ?? 'Outros'
        const ent = porEspecialidade.get(esp) ?? { total: 0, acertos: 0 }
        ent.total++
        if (r.correta) ent.acertos++
        porEspecialidade.set(esp, ent)

        const dif = r.questao.dificuldade
        porDificuldade[dif] ??= { total: 0, acertos: 0 }
        porDificuldade[dif].total++
        if (r.correta) porDificuldade[dif].acertos++
      }

      return {
        sessaoId: sessao.id,
        total: sessao.respostas.length,
        acertos: sessao.acertos,
        erros: sessao.erros,
        tempoTotal: sessao.tempoTotal,
        porEspecialidade: Array.from(porEspecialidade.entries()).map(([nome, v]) => ({
          especialidade: nome,
          total: v.total,
          acertos: v.acertos,
          taxa: v.total > 0 ? v.acertos / v.total : 0,
        })),
        porDificuldade,
      }
    }),
})
