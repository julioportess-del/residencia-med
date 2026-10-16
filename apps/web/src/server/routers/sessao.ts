import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { CriarSessaoInput } from '@residencia-med/types'
import { checarLimiteSimulados } from '@residencia-med/billing'
import { analisarSessao, embaralhar } from '@residencia-med/core'
import { router, procedureProtegida } from '../trpc'
import { montarWhereQuestoes } from '../lib/filtro-questoes'

export const sessaoRouter = router({
  criar: procedureProtegida.input(CriarSessaoInput).mutation(async ({ ctx, input }) => {
    if (input.tipo === 'SIMULADO') {
      const limite = await checarLimiteSimulados(ctx.userId)
      if (!limite.permitido) {
        throw new TRPCError({ code: 'FORBIDDEN', message: limite.motivo ?? 'Limite atingido' })
      }
    }

    const where = await montarWhereQuestoes(ctx.prisma, ctx.userId, input.filtros)
    const candidatas = await ctx.prisma.questao.findMany({
      where,
      select: { id: true },
      // SEQUENCIAL = ordem da prova original (prova histórica)
      orderBy: [{ ano: 'desc' }, { numeroOriginal: 'asc' }, { id: 'asc' }],
    })
    if (candidatas.length === 0) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhuma questão com esses filtros' })
    }
    const ordenadas =
      input.ordem === 'SEQUENCIAL'
        ? candidatas.map((q) => q.id)
        : embaralhar(candidatas.map((q) => q.id))
    const selecionadas = ordenadas.slice(0, input.numeroQuestoes)

    const sessao = await ctx.prisma.sessao.create({
      data: {
        userId: ctx.userId,
        tipo: input.tipo,
        bancaId: input.bancaId,
        configuracao: {
          filtros: input.filtros,
          questaoIds: selecionadas,
          ordem: input.ordem,
          tempoMinutos: input.tempoMinutos,
          numeroQuestoes: input.numeroQuestoes,
        },
      },
    })

    return { sessaoId: sessao.id, questaoIds: selecionadas }
  }),

  /** Resultado analisado (leitura, sem efeitos colaterais). */
  resultado: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const sessao = await ctx.prisma.sessao.findFirst({
        where: { id: input.id, userId: ctx.userId },
        select: {
          id: true,
          tipo: true,
          configuracao: true,
          iniciadaEm: true,
          finalizadaEm: true,
          respostas: {
            select: {
              questaoId: true,
              correta: true,
              tempoSegundos: true,
              confianca: true,
              alternativaLetra: true,
              createdAt: true,
              questao: {
                select: {
                  enunciado: true,
                  gabaritoLetra: true,
                  dificuldade: true,
                  banca: { select: { codigo: true } },
                  ano: true,
                  temas: {
                    where: { primario: true },
                    select: { tema: { select: { especialidade: { select: { nome: true } } } } },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      })
      if (!sessao) throw new TRPCError({ code: 'NOT_FOUND' })
      const { questaoIds } = sessao.configuracao as { questaoIds: string[] }

      const analise = analisarSessao(
        questaoIds,
        sessao.respostas.map((r) => ({
          questaoId: r.questaoId,
          correta: r.correta,
          tempoSegundos: r.tempoSegundos,
          confianca: r.confianca,
          area: r.questao.temas[0]?.tema.especialidade.nome ?? null,
          dificuldade: r.questao.dificuldade,
          respondidaEm: r.createdAt,
        })),
      )
      const porQuestao = new Map(sessao.respostas.map((r) => [r.questaoId, r]))
      return {
        tipo: sessao.tipo,
        finalizadaEm: sessao.finalizadaEm,
        analise,
        questoes: questaoIds.map((qid, i) => {
          const r = porQuestao.get(qid)
          return {
            numero: i + 1,
            questaoId: qid,
            respondida: Boolean(r),
            correta: r?.correta ?? false,
            escolha: r?.alternativaLetra ?? null,
            gabarito: r?.questao.gabaritoLetra ?? null,
            tempoSegundos: r?.tempoSegundos ?? 0,
            resumo: r
              ? `${r.questao.banca.codigo} ${r.questao.ano} · ${r.questao.enunciado.slice(0, 110)}`
              : null,
          }
        }),
      }
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
