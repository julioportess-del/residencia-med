import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { detectarPadroesErro, montarCadernoErros } from '@residencia-med/core'
import { router, procedureProtegida } from '../trpc'

const MotivoErroSchema = z.enum([
  'FALTA_CONHECIMENTO',
  'CONCEITO_ERRADO',
  'LEITURA_ENUNCIADO',
  'PEGADINHA',
  'ESQUECIMENTO',
  'DESATENCAO',
  'OUTRO',
])

const TAMANHO_MAX_TEXTO = 4000

export const cadernoRouter = router({
  /** Caderno completo (derivado das respostas) + padrões de erro + contagens. */
  listar: procedureProtegida.query(async ({ ctx }) => {
    const userId = ctx.userId
    const [respostas, registros, revisoes] = await Promise.all([
      ctx.prisma.resposta.findMany({
        where: { userId },
        select: { questaoId: true, correta: true, confianca: true, createdAt: true },
      }),
      ctx.prisma.registroErro.findMany({
        where: { userId },
        select: {
          questaoId: true,
          motivo: true,
          conceitoCorreto: true,
          anotacao: true,
          resolvido: true,
        },
      }),
      ctx.prisma.itemRevisao.findMany({
        where: { userId },
        select: { questaoId: true, proximaRevisao: true },
      }),
    ])

    const idsErrados = [...new Set(respostas.filter((r) => !r.correta).map((r) => r.questaoId))]
    const questoes = await ctx.prisma.questao.findMany({
      where: { id: { in: idsErrados } },
      select: {
        id: true,
        ano: true,
        enunciado: true,
        banca: { select: { codigo: true } },
        temas: {
          where: { primario: true },
          select: { tema: { select: { nome: true, especialidade: { select: { nome: true } } } } },
          take: 1,
        },
      },
    })
    const porId = new Map(questoes.map((q) => [q.id, q]))

    const entradas = montarCadernoErros({
      respostas,
      registros,
      metadados: new Map(
        questoes.map((q) => [
          q.id,
          {
            tema: q.temas[0]?.tema.nome ?? null,
            area: q.temas[0]?.tema.especialidade.nome ?? null,
          },
        ]),
      ),
      proximasRevisoes: new Map(revisoes.map((r) => [r.questaoId, r.proximaRevisao])),
    })

    return {
      contagem: {
        abertos: entradas.filter((e) => e.status === 'ABERTO').length,
        corrigidos: entradas.filter((e) => e.status === 'CORRIGIDO').length,
        resolvidos: entradas.filter((e) => e.status === 'RESOLVIDO').length,
        semMotivo: entradas.filter((e) => e.status === 'ABERTO' && !e.motivo).length,
      },
      padroes: detectarPadroesErro(entradas),
      itens: entradas.map((e) => {
        const q = porId.get(e.questaoId)
        return {
          ...e,
          banca: q?.banca.codigo ?? '',
          ano: q?.ano ?? null,
          resumo: q?.enunciado.slice(0, 160) ?? '',
        }
      }),
    }
  }),

  /** Registro de uma questão (para o painel de correção). */
  obter: procedureProtegida
    .input(z.object({ questaoId: z.string().cuid() }))
    .query(({ ctx, input }) =>
      ctx.prisma.registroErro.findUnique({
        where: { userId_questaoId: { userId: ctx.userId, questaoId: input.questaoId } },
        select: { motivo: true, conceitoCorreto: true, anotacao: true, resolvido: true },
      }),
    ),

  registrar: procedureProtegida
    .input(
      z.object({
        questaoId: z.string().cuid(),
        motivo: MotivoErroSchema.nullable().optional(),
        conceitoCorreto: z.string().trim().max(TAMANHO_MAX_TEXTO).nullable().optional(),
        anotacao: z.string().trim().max(TAMANHO_MAX_TEXTO).nullable().optional(),
        resolvido: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existe = await ctx.prisma.questao.count({ where: { id: input.questaoId } })
      if (!existe) throw new TRPCError({ code: 'NOT_FOUND' })
      const { questaoId, ...campos } = input
      const dados = Object.fromEntries(
        Object.entries(campos).map(([k, v]) => [k, v === '' ? null : v]),
      )
      return ctx.prisma.registroErro.upsert({
        where: { userId_questaoId: { userId: ctx.userId, questaoId } },
        create: { userId: ctx.userId, questaoId, ...dados },
        update: dados,
        select: { motivo: true, conceitoCorreto: true, anotacao: true, resolvido: true },
      })
    }),
})
