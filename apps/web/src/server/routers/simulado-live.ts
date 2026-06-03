import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

function gerarCodigoSala(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem 0/O/1/I
  let s = ''
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

export const simuladoLiveRouter = router({
  /**
   * Cria simulado ao vivo. Apenas admin de org pode criar.
   */
  criar: procedureProtegida
    .input(
      z.object({
        titulo: z.string().min(2).max(100),
        bancaId: z.string().cuid().optional(),
        numeroQuestoes: z.number().int().min(5).max(120).default(20),
        tempoMinutos: z.number().int().min(5).max(360).default(40),
        iniciaEm: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.organizationId || ctx.user.papelOrg !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores de organização podem criar simulados ao vivo',
        })
      }

      // Sorteia questões da banca
      const where = {
        publicada: true,
        ...(input.bancaId ? { bancaId: input.bancaId } : {}),
      }
      const total = await ctx.prisma.questao.count({ where })
      if (total < input.numeroQuestoes) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Apenas ${total} questões disponíveis nesse filtro`,
        })
      }
      const candidatas = await ctx.prisma.questao.findMany({
        where,
        take: input.numeroQuestoes * 3,
        select: { id: true },
      })
      const questaoIds = candidatas
        .sort(() => Math.random() - 0.5)
        .slice(0, input.numeroQuestoes)
        .map((q) => q.id)

      // Garante código único
      let codigo = gerarCodigoSala()
      for (let i = 0; i < 5; i++) {
        const ja = await ctx.prisma.simuladoLive.findUnique({ where: { codigo } })
        if (!ja) break
        codigo = gerarCodigoSala()
      }

      const simulado = await ctx.prisma.simuladoLive.create({
        data: {
          codigo,
          titulo: input.titulo,
          bancaId: input.bancaId,
          organizationId: ctx.user.organizationId,
          criadoPor: ctx.userId,
          numeroQuestoes: input.numeroQuestoes,
          tempoMinutos: input.tempoMinutos,
          questaoIds,
          iniciaEm: input.iniciaEm,
        },
      })

      return { id: simulado.id, codigo: simulado.codigo }
    }),

  /**
   * Detalhe da sala. Aberto a qualquer logado (precisa do código).
   */
  porCodigo: procedureProtegida
    .input(z.object({ codigo: z.string().length(6) }))
    .query(async ({ ctx, input }) => {
      const s = await ctx.prisma.simuladoLive.findUnique({
        where: { codigo: input.codigo.toUpperCase() },
        include: {
          banca: { select: { codigo: true, nome: true, cor: true } },
          _count: { select: { participantes: true } },
        },
      })
      if (!s) throw new TRPCError({ code: 'NOT_FOUND', message: 'Sala não encontrada' })
      return s
    }),

  /**
   * Entra na sala (cria ParticipanteLive idempotentemente).
   */
  entrar: procedureProtegida
    .input(z.object({ codigo: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const s = await ctx.prisma.simuladoLive.findUnique({
        where: { codigo: input.codigo.toUpperCase() },
      })
      if (!s) throw new TRPCError({ code: 'NOT_FOUND' })
      if (s.status === 'ENCERRADO') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Sala encerrada' })
      }

      const participante = await ctx.prisma.participanteLive.upsert({
        where: {
          simuladoLiveId_userId: { simuladoLiveId: s.id, userId: ctx.userId },
        },
        create: { simuladoLiveId: s.id, userId: ctx.userId },
        update: {},
      })

      return {
        simuladoLiveId: s.id,
        participanteId: participante.id,
        questaoIds: s.questaoIds,
        tempoMinutos: s.tempoMinutos,
      }
    }),

  /**
   * Iniciar (apenas criador). Marca status EM_ANDAMENTO + define encerraEm.
   */
  iniciar: procedureProtegida
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const s = await ctx.prisma.simuladoLive.findUnique({ where: { id: input.id } })
      if (!s) throw new TRPCError({ code: 'NOT_FOUND' })
      if (s.criadoPor !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas o criador pode iniciar' })
      }
      if (s.status !== 'AGUARDANDO') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Já iniciou' })
      }
      const agora = new Date()
      const encerra = new Date(agora.getTime() + s.tempoMinutos * 60_000)
      await ctx.prisma.simuladoLive.update({
        where: { id: s.id },
        data: { status: 'EM_ANDAMENTO', iniciaEm: agora, encerraEm: encerra },
      })
      return { ok: true }
    }),

  /**
   * Submete respostas (em batch ao final ou por questão).
   * Server calcula acertos.
   */
  finalizarParticipante: procedureProtegida
    .input(
      z.object({
        simuladoLiveId: z.string().cuid(),
        respostas: z.array(
          z.object({
            questaoId: z.string().cuid(),
            alternativaLetra: z.enum(['A', 'B', 'C', 'D', 'E']),
            tempoSegundos: z.number().int().nonnegative().max(3600),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const part = await ctx.prisma.participanteLive.findUnique({
        where: {
          simuladoLiveId_userId: {
            simuladoLiveId: input.simuladoLiveId,
            userId: ctx.userId,
          },
        },
      })
      if (!part) throw new TRPCError({ code: 'NOT_FOUND' })
      if (part.finalizadoEm) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Já finalizado' })
      }

      const questaoIds = input.respostas.map((r) => r.questaoId)
      const questoes = await ctx.prisma.questao.findMany({
        where: { id: { in: questaoIds } },
        select: { id: true, gabaritoLetra: true },
      })
      const gabaritoMap = new Map(questoes.map((q) => [q.id, q.gabaritoLetra]))

      let acertos = 0
      let erros = 0
      let tempoTotal = 0
      const respostasAnotadas = input.respostas.map((r) => {
        const correta = gabaritoMap.get(r.questaoId) === r.alternativaLetra
        if (correta) acertos++
        else erros++
        tempoTotal += r.tempoSegundos
        return { ...r, correta }
      })

      await ctx.prisma.participanteLive.update({
        where: { id: part.id },
        data: {
          finalizadoEm: new Date(),
          acertos,
          erros,
          tempoTotal,
          respostasJson: respostasAnotadas as never,
        },
      })

      return { acertos, erros, total: input.respostas.length, tempoTotal }
    }),

  /**
   * Leaderboard ao vivo: ranking dos participantes por acertos desc, tempo asc.
   * Polling do client a cada 5s.
   */
  leaderboard: procedureProtegida
    .input(z.object({ simuladoLiveId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const s = await ctx.prisma.simuladoLive.findUnique({
        where: { id: input.simuladoLiveId },
        include: {
          participantes: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: [{ acertos: 'desc' }, { tempoTotal: 'asc' }, { joinedAt: 'asc' }],
          },
        },
      })
      if (!s) throw new TRPCError({ code: 'NOT_FOUND' })

      return {
        id: s.id,
        codigo: s.codigo,
        titulo: s.titulo,
        status: s.status,
        encerraEm: s.encerraEm,
        numeroQuestoes: s.numeroQuestoes,
        eCriador: s.criadoPor === ctx.userId,
        ranking: s.participantes.map((p, i) => ({
          posicao: i + 1,
          userId: p.userId,
          nome: p.user.name ?? p.user.email.split('@')[0],
          acertos: p.acertos,
          erros: p.erros,
          tempoTotal: p.tempoTotal,
          finalizado: !!p.finalizadoEm,
          ehVoce: p.userId === ctx.userId,
        })),
      }
    }),

  /**
   * Lista simulados live ativos da org do user.
   */
  listarOrg: procedureProtegida.query(async ({ ctx }) => {
    if (!ctx.user.organizationId) return []
    return ctx.prisma.simuladoLive.findMany({
      where: {
        organizationId: ctx.user.organizationId,
        status: { in: ['AGUARDANDO', 'EM_ANDAMENTO'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        banca: { select: { codigo: true } },
        _count: { select: { participantes: true } },
      },
      take: 20,
    })
  }),
})
