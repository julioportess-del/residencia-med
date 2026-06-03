import { Prisma } from '@residencia-med/db'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import {
  calcularResultados,
  escolherVariante,
  variantesValidas,
  type Variante,
} from '@residencia-med/core'
import { router, procedurePublica, procedureProtegida } from '../trpc'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

const procedureAdmin = procedureProtegida.use(async ({ ctx, next }) => {
  if (!ADMIN_EMAILS.includes(ctx.user.email.toLowerCase())) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito' })
  }
  return next()
})

const varianteSchema = z.object({
  nome: z.string().min(1).max(50),
  peso: z.number().int().min(0).max(100),
})

export const experimentosRouter = router({
  /**
   * Atribui (ou recupera) variante para o usuário corrente em um experimento ativo.
   * Idempotente: chamadas repetidas sempre devolvem a mesma variante.
   * Se o experimento não existir ou estiver inativo, devolve `variante: null`.
   */
  atribuir: procedureProtegida
    .input(z.object({ chave: z.string().min(1).max(60) }))
    .mutation(async ({ ctx, input }) => {
      const exp = await ctx.prisma.experimento.findUnique({
        where: { chave: input.chave },
      })
      if (!exp || !exp.ativo) {
        return { variante: null as string | null, experimentoId: null as string | null }
      }
      if (!variantesValidas(exp.variantesJson)) {
        return { variante: null, experimentoId: exp.id }
      }
      const variantes = exp.variantesJson as Variante[]

      const ja = await ctx.prisma.atribuicaoExperimento.findUnique({
        where: {
          experimentoId_userId: {
            experimentoId: exp.id,
            userId: ctx.userId,
          },
        },
      })
      if (ja) return { variante: ja.variante, experimentoId: exp.id }

      const variante = escolherVariante(exp.chave, ctx.userId, variantes)
      await ctx.prisma.atribuicaoExperimento.create({
        data: {
          experimentoId: exp.id,
          userId: ctx.userId,
          variante,
        },
      })
      return { variante, experimentoId: exp.id }
    }),

  /**
   * Registra um evento (view, click, conversion, etc) na variante atribuída do usuário.
   * Se o usuário não tem atribuição, cria silenciosamente uma antes de registrar.
   */
  registrarEvento: procedureProtegida
    .input(
      z.object({
        chave: z.string().min(1).max(60),
        evento: z.string().min(1).max(40),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exp = await ctx.prisma.experimento.findUnique({
        where: { chave: input.chave },
      })
      if (!exp || !exp.ativo) return { ok: false as const }
      if (!variantesValidas(exp.variantesJson)) return { ok: false as const }

      let atrib = await ctx.prisma.atribuicaoExperimento.findUnique({
        where: {
          experimentoId_userId: { experimentoId: exp.id, userId: ctx.userId },
        },
      })
      if (!atrib) {
        const variante = escolherVariante(exp.chave, ctx.userId, exp.variantesJson as Variante[])
        atrib = await ctx.prisma.atribuicaoExperimento.create({
          data: { experimentoId: exp.id, userId: ctx.userId, variante },
        })
      }

      await ctx.prisma.eventoExperimento.create({
        data: {
          experimentoId: exp.id,
          userId: ctx.userId,
          variante: atrib.variante,
          evento: input.evento,
          metadataJson: input.metadata
            ? (input.metadata as Record<string, unknown> as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      })
      return { ok: true as const }
    }),

  /** Lista pública de experimentos ativos (apenas chave + variantes — sem dados sensíveis). */
  ativos: procedurePublica.query(async ({ ctx }) => {
    return ctx.prisma.experimento.findMany({
      where: { ativo: true },
      select: { chave: true, nome: true, variantesJson: true },
    })
  }),

  // ---- ADMIN ----

  listar: procedureAdmin.query(async ({ ctx }) => {
    return ctx.prisma.experimento.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { atribuicoes: true, eventos: true } },
      },
    })
  }),

  criar: procedureAdmin
    .input(
      z.object({
        chave: z
          .string()
          .min(2)
          .max(60)
          .regex(/^[a-z0-9-]+$/, 'Use minúsculas, números e hífens'),
        nome: z.string().min(2).max(120),
        descricao: z.string().max(500).optional(),
        variantes: z.array(varianteSchema).min(2).max(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ja = await ctx.prisma.experimento.findUnique({ where: { chave: input.chave } })
      if (ja) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Chave já usada' })
      }
      return ctx.prisma.experimento.create({
        data: {
          chave: input.chave,
          nome: input.nome,
          descricao: input.descricao,
          variantesJson: input.variantes,
          ativo: false,
        },
      })
    }),

  ativar: procedureAdmin
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.experimento.update({
        where: { id: input.id },
        data: { ativo: true, iniciadoEm: new Date(), encerradoEm: null },
      })
    }),

  encerrar: procedureAdmin
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.experimento.update({
        where: { id: input.id },
        data: { ativo: false, encerradoEm: new Date() },
      })
    }),

  resultados: procedureAdmin
    .input(
      z.object({
        id: z.string().cuid(),
        eventoConversao: z.string().min(1).max(40).default('conversao'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [exp, atribuicoes, eventos] = await Promise.all([
        ctx.prisma.experimento.findUnique({ where: { id: input.id } }),
        ctx.prisma.atribuicaoExperimento.findMany({
          where: { experimentoId: input.id },
          select: { variante: true, userId: true },
        }),
        ctx.prisma.eventoExperimento.findMany({
          where: { experimentoId: input.id },
          select: { variante: true, userId: true, evento: true },
        }),
      ])
      if (!exp) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      const eventosUnicos = new Set(eventos.map((e) => e.evento))
      const resumoConversao = calcularResultados(atribuicoes, eventos, input.eventoConversao)
      return {
        experimento: exp,
        eventosDistintos: Array.from(eventosUnicos).sort(),
        resumo: resumoConversao,
        totalEventos: eventos.length,
        totalAtribuicoes: atribuicoes.length,
      }
    }),
})
