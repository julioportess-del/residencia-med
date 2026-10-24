import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { ProcessoSeletivoInput } from '@residencia-med/types'
import { chaveData, etapaProcesso, pctAcertos, pendenciasProcesso } from '@residencia-med/core'
import { router, procedureProtegida } from '../trpc'

const paraData = (chave: string | null) => (chave ? new Date(`${chave}T00:00:00Z`) : null)

function dadosPersistencia(input: ProcessoSeletivoInput) {
  return {
    ...input,
    inicioInscricoes: paraData(input.inicioInscricoes),
    fimInscricoes: paraData(input.fimInscricoes),
    dataProva: paraData(input.dataProva),
  }
}

export const minhasProvasRouter = router({
  /** Processos do usuário com etapa e pendências derivadas. Sem data vão para o fim. */
  listar: procedureProtegida.query(async ({ ctx }) => {
    const hoje = new Date()
    const processos = await ctx.prisma.processoSeletivo.findMany({
      where: { userId: ctx.userId },
      include: { banca: { select: { codigo: true, nome: true } } },
      orderBy: [{ dataProva: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
    })
    return processos.map((p) => ({
      ...p,
      inicioInscricoes: p.inicioInscricoes ? chaveData(p.inicioInscricoes) : null,
      fimInscricoes: p.fimInscricoes ? chaveData(p.fimInscricoes) : null,
      dataProva: p.dataProva ? chaveData(p.dataProva) : null,
      etapa: etapaProcesso(p, hoje),
      pendencias: pendenciasProcesso(p, hoje),
      pctAcertos: pctAcertos(p.acertos, p.totalQuestoes),
    }))
  }),

  criar: procedureProtegida.input(ProcessoSeletivoInput).mutation(async ({ ctx, input }) => {
    return ctx.prisma.processoSeletivo.create({
      data: { ...dadosPersistencia(input), userId: ctx.userId },
      select: { id: true },
    })
  }),

  atualizar: procedureProtegida
    .input(z.object({ id: z.string().cuid(), dados: ProcessoSeletivoInput }))
    .mutation(async ({ ctx, input }) => {
      const { count } = await ctx.prisma.processoSeletivo.updateMany({
        where: { id: input.id, userId: ctx.userId },
        data: dadosPersistencia(input.dados),
      })
      if (count === 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'Prova não encontrada' })
      return { ok: true }
    }),

  excluir: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.processoSeletivo.deleteMany({
        where: { id: input.id, userId: ctx.userId },
      })
      return { ok: true }
    }),
})
