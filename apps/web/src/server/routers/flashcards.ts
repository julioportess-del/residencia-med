import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import {
  cartaoNovo,
  preverIntervalos,
  revisarCartao,
  rotuloIntervalo,
  type EstadoCartao,
} from '@residencia-med/core'
import type { Flashcard } from '@residencia-med/db'
import { router, procedureProtegida } from '../trpc'

const DECK_PADRAO = 'Geral'
const DECK_ERROS = 'Caderno de erros'
const TAMANHO_MAX_FACE = 2000
const TAMANHO_FILA = 50
const JANELA_RETENCAO_DIAS = 30

const NotaSchema = z.enum(['ERREI', 'DIFICIL', 'BOM', 'FACIL'])

function estadoDoCartao(c: Flashcard): EstadoCartao {
  return {
    vencimento: c.vencimento,
    estabilidade: c.estabilidade,
    dificuldade: c.dificuldade,
    diasDecorridos: c.diasDecorridos,
    diasAgendados: c.diasAgendados,
    passosAprendizado: c.passosAprendizado,
    repeticoes: c.repeticoes,
    lapsos: c.lapsos,
    estado: c.estado,
    ultimaRevisao: c.ultimaRevisao,
  }
}

export const flashcardsRouter = router({
  /** Decks com contagem de cartões, vencidos e novos. */
  decks: procedureProtegida.query(async ({ ctx }) => {
    const agora = new Date()
    const decks = await ctx.prisma.deck.findMany({
      where: { userId: ctx.userId },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, descricao: true },
    })
    return Promise.all(
      decks.map(async (d) => {
        const base = { userId: ctx.userId, deckId: d.id, suspenso: false }
        const [total, vencidos, novos] = await Promise.all([
          ctx.prisma.flashcard.count({ where: { userId: ctx.userId, deckId: d.id } }),
          ctx.prisma.flashcard.count({ where: { ...base, vencimento: { lte: agora } } }),
          ctx.prisma.flashcard.count({ where: { ...base, estado: 'NOVO' } }),
        ])
        return { ...d, total, vencidos, novos }
      }),
    )
  }),

  criarDeck: procedureProtegida
    .input(
      z.object({
        nome: z.string().trim().min(1).max(80),
        descricao: z.string().max(300).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existe = await ctx.prisma.deck.findUnique({
        where: { userId_nome: { userId: ctx.userId, nome: input.nome } },
      })
      if (existe)
        throw new TRPCError({ code: 'CONFLICT', message: 'Já existe um deck com esse nome.' })
      return ctx.prisma.deck.create({
        data: { userId: ctx.userId, nome: input.nome, descricao: input.descricao },
        select: { id: true, nome: true },
      })
    }),

  /** Cria cartão. Sem deck informado: "Caderno de erros" se veio de um erro, senão "Geral". */
  criar: procedureProtegida
    .input(
      z.object({
        frente: z.string().trim().min(1).max(TAMANHO_MAX_FACE),
        verso: z.string().trim().min(1).max(TAMANHO_MAX_FACE),
        deckId: z.string().cuid().optional(),
        questaoId: z.string().cuid().optional(),
        origem: z.enum(['MANUAL', 'ERRO', 'IA']).default('MANUAL'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let deckId = input.deckId
      if (deckId) {
        const dono = await ctx.prisma.deck.count({ where: { id: deckId, userId: ctx.userId } })
        if (!dono) throw new TRPCError({ code: 'NOT_FOUND', message: 'Deck não encontrado' })
      } else {
        const nome = input.origem === 'ERRO' ? DECK_ERROS : DECK_PADRAO
        const deck = await ctx.prisma.deck.upsert({
          where: { userId_nome: { userId: ctx.userId, nome } },
          create: { userId: ctx.userId, nome },
          update: {},
          select: { id: true },
        })
        deckId = deck.id
      }
      const estado = cartaoNovo(new Date())
      return ctx.prisma.flashcard.create({
        data: {
          userId: ctx.userId,
          deckId,
          questaoId: input.questaoId,
          frente: input.frente,
          verso: input.verso,
          origem: input.origem,
          ...estado,
        },
        select: { id: true, deckId: true },
      })
    }),

  /** Cartões vencidos (não suspensos), com a previsão de cada botão. */
  fila: procedureProtegida
    .input(z.object({ deckId: z.string().cuid().optional() }).default({}))
    .query(async ({ ctx, input }) => {
      const agora = new Date()
      const where = {
        userId: ctx.userId,
        suspenso: false,
        vencimento: { lte: agora },
        ...(input.deckId ? { deckId: input.deckId } : {}),
      }
      const [total, cartoes] = await Promise.all([
        ctx.prisma.flashcard.count({ where }),
        ctx.prisma.flashcard.findMany({
          where,
          orderBy: { vencimento: 'asc' },
          take: TAMANHO_FILA,
          include: { deck: { select: { nome: true } } },
        }),
      ])
      return {
        total,
        cartoes: cartoes.map((c) => {
          const previsao = preverIntervalos(estadoDoCartao(c), agora)
          return {
            id: c.id,
            frente: c.frente,
            verso: c.verso,
            deck: c.deck.nome,
            questaoId: c.questaoId,
            favorito: c.favorito,
            estado: c.estado,
            intervalos: {
              ERREI: rotuloIntervalo(agora, previsao.ERREI),
              DIFICIL: rotuloIntervalo(agora, previsao.DIFICIL),
              BOM: rotuloIntervalo(agora, previsao.BOM),
              FACIL: rotuloIntervalo(agora, previsao.FACIL),
            },
          }
        }),
      }
    }),

  revisar: procedureProtegida
    .input(z.object({ id: z.string().cuid(), nota: NotaSchema }))
    .mutation(async ({ ctx, input }) => {
      const cartao = await ctx.prisma.flashcard.findFirst({
        where: { id: input.id, userId: ctx.userId },
      })
      if (!cartao) throw new TRPCError({ code: 'NOT_FOUND' })
      const agora = new Date()
      const { cartao: novo, log } = revisarCartao(estadoDoCartao(cartao), input.nota, agora)
      await ctx.prisma.$transaction([
        ctx.prisma.flashcard.update({ where: { id: cartao.id }, data: novo }),
        ctx.prisma.revisaoFlashcard.create({
          data: {
            flashcardId: cartao.id,
            userId: ctx.userId,
            nota: log.nota,
            estadoAntes: log.estadoAntes,
            revisadoEm: agora,
          },
        }),
      ])
      return { proximaRevisao: novo.vencimento }
    }),

  alternar: procedureProtegida
    .input(z.object({ id: z.string().cuid(), campo: z.enum(['suspenso', 'favorito']) }))
    .mutation(async ({ ctx, input }) => {
      const cartao = await ctx.prisma.flashcard.findFirst({
        where: { id: input.id, userId: ctx.userId },
        select: { suspenso: true, favorito: true },
      })
      if (!cartao) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.prisma.flashcard.update({
        where: { id: input.id },
        data: { [input.campo]: !cartao[input.campo] },
        select: { suspenso: true, favorito: true },
      })
    }),

  excluir: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { count } = await ctx.prisma.flashcard.deleteMany({
        where: { id: input.id, userId: ctx.userId },
      })
      if (!count) throw new TRPCError({ code: 'NOT_FOUND' })
      return { ok: true }
    }),

  /** Lista de cartões de um deck (para gerenciar). */
  listar: procedureProtegida
    .input(z.object({ deckId: z.string().cuid() }))
    .query(({ ctx, input }) =>
      ctx.prisma.flashcard.findMany({
        where: { userId: ctx.userId, deckId: input.deckId },
        orderBy: [{ favorito: 'desc' }, { vencimento: 'asc' }],
        select: {
          id: true,
          frente: true,
          verso: true,
          suspenso: true,
          favorito: true,
          estado: true,
          vencimento: true,
          lapsos: true,
          questaoId: true,
        },
      }),
    ),

  /** Revisões de hoje e retenção real (cartões em revisão lembrados) nos últimos 30 dias. */
  estatisticas: procedureProtegida.query(async ({ ctx }) => {
    const agora = new Date()
    const inicioHoje = new Date(agora)
    inicioHoje.setUTCHours(3, 0, 0, 0) // 00h de Brasília
    if (inicioHoje > agora) inicioHoje.setUTCDate(inicioHoje.getUTCDate() - 1)
    const desde = new Date(agora.getTime() - JANELA_RETENCAO_DIAS * 86_400_000)

    const [hoje, emRevisao, lembradas, totalCartoes] = await Promise.all([
      ctx.prisma.revisaoFlashcard.count({
        where: { userId: ctx.userId, revisadoEm: { gte: inicioHoje } },
      }),
      ctx.prisma.revisaoFlashcard.count({
        where: { userId: ctx.userId, revisadoEm: { gte: desde }, estadoAntes: 'REVISAO' },
      }),
      ctx.prisma.revisaoFlashcard.count({
        where: {
          userId: ctx.userId,
          revisadoEm: { gte: desde },
          estadoAntes: 'REVISAO',
          nota: { not: 'ERREI' },
        },
      }),
      ctx.prisma.flashcard.count({ where: { userId: ctx.userId } }),
    ])
    return {
      revisoesHoje: hoje,
      totalCartoes,
      retencao30d: emRevisao > 0 ? lembradas / emRevisao : null,
      amostraRetencao: emRevisao,
    }
  }),
})
