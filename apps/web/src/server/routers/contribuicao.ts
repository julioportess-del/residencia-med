import { createHash } from 'node:crypto'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { validarSubmissao } from '@residencia-med/ai'
import { obterPlanoUsuario, temAcesso } from '@residencia-med/billing'
import { router, procedureProtegida } from '../trpc'
import { criarNotificacao } from '../notificacoes'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

const procedureAdminGlobal = procedureProtegida.use(async ({ ctx, next }) => {
  if (!ADMIN_EMAILS.includes(ctx.user.email.toLowerCase())) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores globais' })
  }
  return next()
})

const AlternativaSchema = z.object({
  letra: z.enum(['A', 'B', 'C', 'D', 'E']),
  texto: z.string().min(2).max(800),
  correta: z.boolean(),
  explicacao: z.string().max(800).optional(),
})

export const contribuicaoRouter = router({
  /**
   * Submete uma questão para revisão.
   * Gate: usuário PRO ou PREMIUM (FREE não pode contribuir).
   * Limite anti-spam: máx 5 submissões pendentes simultâneas.
   */
  submeter: procedureProtegida
    .input(
      z.object({
        bancaId: z.string().cuid(),
        ano: z.number().int().min(2000).max(new Date().getFullYear()),
        enunciado: z.string().min(20).max(4000),
        vignette: z.string().max(4000).optional(),
        alternativas: z.array(AlternativaSchema).length(5),
        gabaritoLetra: z.enum(['A', 'B', 'C', 'D', 'E']),
        fonteUrl: z.string().url().optional(),
        comentario: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const plano = await obterPlanoUsuario(ctx.userId)
      if (plano === 'FREE') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Contribuir com questões é exclusivo dos planos Pro e Premium.',
        })
      }
      void temAcesso

      // Validações cruzadas
      const corretas = input.alternativas.filter((a) => a.correta)
      if (corretas.length !== 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Marque exatamente uma alternativa como correta.',
        })
      }
      if (corretas[0]?.letra !== input.gabaritoLetra) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'O gabarito não bate com a alternativa marcada como correta.',
        })
      }
      const letras = new Set(input.alternativas.map((a) => a.letra))
      if (letras.size !== 5) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'As 5 alternativas devem ter letras distintas (A-E).',
        })
      }

      // Anti-duplicate: hash do enunciado
      const hash = createHash('sha256')
        .update(
          ((input.vignette ?? '') + input.enunciado).toLowerCase().replace(/\s+/g, ' ').trim(),
        )
        .digest('hex')

      const ja = await ctx.prisma.questao.findUnique({ where: { hash } })
      if (ja) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Esta questão já existe no banco (mesmo enunciado).',
        })
      }

      // Limite anti-spam
      const pendentes = await ctx.prisma.submissaoQuestao.count({
        where: {
          userId: ctx.userId,
          status: { in: ['PENDENTE_IA', 'PENDENTE_REVISAO'] },
        },
      })
      if (pendentes >= 5) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Você já tem 5 submissões pendentes. Aguarde a revisão delas.',
        })
      }

      const banca = await ctx.prisma.banca.findUnique({ where: { id: input.bancaId } })
      if (!banca) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Banca inválida' })

      // Cria submissão e tenta validar com IA
      const submissao = await ctx.prisma.submissaoQuestao.create({
        data: {
          userId: ctx.userId,
          bancaId: input.bancaId,
          ano: input.ano,
          enunciado: input.enunciado,
          enunciadoVignette: input.vignette,
          alternativasJson: input.alternativas as never,
          gabaritoLetra: input.gabaritoLetra,
          fonteUrl: input.fonteUrl,
          comentario: input.comentario,
          status: 'PENDENTE_IA',
        },
      })

      // Validação IA — best-effort, atualiza status quando termina
      void validarSubmissao(
        {
          enunciado: input.enunciado,
          vignette: input.vignette,
          alternativas: input.alternativas,
          gabaritoLetra: input.gabaritoLetra,
          bancaCodigo: banca.codigo,
          ano: input.ano,
          fonteUrl: input.fonteUrl,
        },
        ctx.userId,
      )
        .then(async (resultado) => {
          const novoStatus = resultado.score < 0.4 ? 'REJEITADA_IA' : 'PENDENTE_REVISAO'
          await ctx.prisma.submissaoQuestao.update({
            where: { id: submissao.id },
            data: {
              status: novoStatus,
              scoreIA: resultado.score,
              motivoIA:
                resultado.motivo +
                (resultado.problemas.length > 0
                  ? `\n\nProblemas: ${resultado.problemas.join('; ')}`
                  : ''),
            },
          })
          await criarNotificacao({
            userId: ctx.userId,
            tipo: 'CONTRIBUICAO_VALIDADA_IA',
            titulo:
              novoStatus === 'REJEITADA_IA'
                ? 'IA reprovou sua submissão'
                : 'Submissão aguardando revisão humana',
            conteudo: `Score IA: ${Math.round(resultado.score * 100)}/100. ${resultado.motivo.slice(0, 200)}`,
            link: '/contribuir',
          })
        })
        .catch(async (e) => {
          // Falha de IA — manda para revisão humana sem rejeitar
          await ctx.prisma.submissaoQuestao.update({
            where: { id: submissao.id },
            data: {
              status: 'PENDENTE_REVISAO',
              motivoIA: `Falha na validação automática: ${(e as Error).message}`,
            },
          })
        })

      return { submissaoId: submissao.id }
    }),

  /**
   * Lista submissões do próprio usuário.
   */
  minhas: procedureProtegida.query(async ({ ctx }) => {
    return ctx.prisma.submissaoQuestao.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        banca: { select: { codigo: true, nome: true } },
      },
      take: 50,
    })
  }),

  // ==================== ADMIN ====================

  fila: procedureAdminGlobal
    .input(
      z
        .object({
          status: z
            .enum(['PENDENTE_IA', 'PENDENTE_REVISAO', 'APROVADA', 'REJEITADA', 'REJEITADA_IA'])
            .optional(),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.submissaoQuestao.findMany({
        where: { status: input.status ?? 'PENDENTE_REVISAO' },
        orderBy: { createdAt: 'asc' },
        include: {
          banca: { select: { codigo: true, nome: true } },
          user: { select: { email: true, name: true } },
        },
        take: 50,
      })
    }),

  detalhe: procedureAdminGlobal
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const s = await ctx.prisma.submissaoQuestao.findUnique({
        where: { id: input.id },
        include: {
          banca: true,
          user: { select: { email: true, name: true } },
        },
      })
      if (!s) throw new TRPCError({ code: 'NOT_FOUND' })
      return s
    }),

  aprovar: procedureAdminGlobal
    .input(
      z.object({
        id: z.string().cuid(),
        dificuldade: z.enum(['FACIL', 'MEDIO', 'DIFICIL', 'MUITO_DIFICIL']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const s = await ctx.prisma.submissaoQuestao.findUnique({
        where: { id: input.id },
        include: { banca: true },
      })
      if (!s) throw new TRPCError({ code: 'NOT_FOUND' })
      if (s.status === 'APROVADA')
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Já aprovada' })

      type AltPayload = { letra: string; texto: string; correta?: boolean; explicacao?: string }
      const alternativas = s.alternativasJson as unknown as AltPayload[]
      const hash = createHash('sha256')
        .update(
          ((s.enunciadoVignette ?? '') + s.enunciado).toLowerCase().replace(/\s+/g, ' ').trim(),
        )
        .digest('hex')

      // Garantir Prova
      const prova = await ctx.prisma.prova.upsert({
        where: { bancaId_ano_tipo: { bancaId: s.bancaId, ano: s.ano, tipo: 'R1' } },
        create: { bancaId: s.bancaId, ano: s.ano, tipo: 'R1' },
        update: {},
      })

      const explicacaoMd = `_Questão contribuída pela comunidade._\n\n${s.motivoIA ?? ''}`

      const questao = await ctx.prisma.questao.create({
        data: {
          bancaId: s.bancaId,
          provaId: prova.id,
          enunciado: s.enunciado,
          enunciadoVignette: s.enunciadoVignette,
          gabaritoLetra: s.gabaritoLetra,
          dificuldade: input.dificuldade,
          ano: s.ano,
          hash,
          fonte: s.fonteUrl ?? undefined,
          explicacao: explicacaoMd,
          explicacaoMd,
          publicada: true,
          alternativas: {
            create: alternativas.map((a, i) => ({
              letra: a.letra,
              texto: a.texto,
              correta: a.letra === s.gabaritoLetra,
              explicacaoErro: a.letra !== s.gabaritoLetra ? a.explicacao : undefined,
              ordem: i,
            })),
          },
        },
      })

      await ctx.prisma.submissaoQuestao.update({
        where: { id: s.id },
        data: {
          status: 'APROVADA',
          questaoCriadaId: questao.id,
          revisadaPor: ctx.userId,
          revisadaEm: new Date(),
        },
      })

      await criarNotificacao({
        userId: s.userId,
        tipo: 'CONTRIBUICAO_APROVADA',
        titulo: 'Sua questão foi aprovada e publicada!',
        conteudo: `Sua submissão para a banca ${s.banca.codigo} foi aprovada e está no banco público.`,
        link: `/questoes/${questao.id}`,
      })

      return { ok: true, questaoId: questao.id }
    }),

  rejeitar: procedureAdminGlobal
    .input(z.object({ id: z.string().cuid(), motivo: z.string().min(10).max(800) }))
    .mutation(async ({ ctx, input }) => {
      const s = await ctx.prisma.submissaoQuestao.findUnique({ where: { id: input.id } })
      if (!s) throw new TRPCError({ code: 'NOT_FOUND' })
      await ctx.prisma.submissaoQuestao.update({
        where: { id: input.id },
        data: {
          status: 'REJEITADA',
          revisadaPor: ctx.userId,
          revisadaEm: new Date(),
          motivoRejeicao: input.motivo,
        },
      })

      await criarNotificacao({
        userId: s.userId,
        tipo: 'CONTRIBUICAO_REJEITADA',
        titulo: 'Sua submissão foi rejeitada',
        conteudo: input.motivo,
        link: '/contribuir',
      })

      return { ok: true }
    }),
})
