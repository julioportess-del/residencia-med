import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, procedureProtegida } from '../trpc'

export const cursosRouter = router({
  listarFases: procedureProtegida.query(async ({ ctx }) => {
    // Devolve só as fases que têm pelo menos uma Grande Área publicada
    const comConteudo = await ctx.prisma.grandeArea.findMany({
      where: { publicado: true },
      select: { fase: true },
      distinct: ['fase'],
    })
    const temExtensivo = comConteudo.some((c) => c.fase === 'EXTENSIVO')
    const temRetaFinal = comConteudo.some((c) => c.fase === 'RETA_FINAL')
    return [
      { fase: 'EXTENSIVO' as const, disponivel: temExtensivo },
      { fase: 'RETA_FINAL' as const, disponivel: temRetaFinal },
    ]
  }),

  listarGrandesAreas: procedureProtegida
    .input(z.object({ fase: z.enum(['EXTENSIVO', 'RETA_FINAL']) }))
    .query(async ({ ctx, input }) => {
      const areas = await ctx.prisma.grandeArea.findMany({
        where: { fase: input.fase, publicado: true },
        orderBy: { ordem: 'asc' },
        include: {
          _count: { select: { disciplinas: true } },
        },
      })
      return areas.map((a) => ({
        id: a.id,
        slug: a.slug,
        nome: a.nome,
        descricao: a.descricao,
        capaUrl: a.capaUrl,
        corTema: a.corTema,
        totalDisciplinas: a._count.disciplinas,
      }))
    }),

  obterGrandeArea: procedureProtegida
    .input(z.object({ fase: z.enum(['EXTENSIVO', 'RETA_FINAL']), areaSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const area = await ctx.prisma.grandeArea.findFirst({
        where: { slug: input.areaSlug, fase: input.fase, publicado: true },
        include: {
          disciplinas: {
            orderBy: { ordem: 'asc' },
            include: {
              _count: { select: { aulas: true } },
            },
          },
        },
      })
      if (!area) throw new TRPCError({ code: 'NOT_FOUND' })
      return area
    }),

  obterDisciplina: procedureProtegida
    .input(
      z.object({
        fase: z.enum(['EXTENSIVO', 'RETA_FINAL']),
        areaSlug: z.string(),
        disciplinaSlug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const disc = await ctx.prisma.disciplina.findFirst({
        where: {
          slug: input.disciplinaSlug,
          grandeArea: { slug: input.areaSlug, fase: input.fase, publicado: true },
        },
        include: {
          grandeArea: { select: { id: true, nome: true, slug: true, corTema: true } },
          aulas: {
            orderBy: { ordem: 'asc' },
            include: {
              videos: { select: { tipo: true, duracaoS: true } },
              progresso: { where: { userId: ctx.userId }, select: { concluida: true } },
            },
          },
        },
      })
      if (!disc) throw new TRPCError({ code: 'NOT_FOUND' })
      return disc
    }),

  obterAula: procedureProtegida
    .input(
      z.object({
        fase: z.enum(['EXTENSIVO', 'RETA_FINAL']),
        areaSlug: z.string(),
        disciplinaSlug: z.string(),
        aulaSlug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const aula = await ctx.prisma.aula.findFirst({
        where: {
          slug: input.aulaSlug,
          disciplina: {
            slug: input.disciplinaSlug,
            grandeArea: { slug: input.areaSlug, fase: input.fase, publicado: true },
          },
        },
        include: {
          disciplina: {
            include: {
              grandeArea: { select: { id: true, nome: true, slug: true, corTema: true } },
            },
          },
          videos: { orderBy: { tipo: 'asc' } },
          materiais: true,
          progresso: { where: { userId: ctx.userId } },
        },
      })
      if (!aula) throw new TRPCError({ code: 'NOT_FOUND' })
      return aula
    }),

  marcarConcluida: procedureProtegida
    .input(z.object({ aulaId: z.string(), concluida: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.progressoAula.upsert({
        where: { userId_aulaId: { userId: ctx.userId, aulaId: input.aulaId } },
        create: {
          userId: ctx.userId,
          aulaId: input.aulaId,
          concluida: input.concluida,
          concluidaEm: input.concluida ? new Date() : null,
        },
        update: {
          concluida: input.concluida,
          concluidaEm: input.concluida ? new Date() : null,
        },
      })
      return { ok: true }
    }),

  salvarProgresso: procedureProtegida
    .input(z.object({ aulaId: z.string(), tempoAssistidoS: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.progressoAula.upsert({
        where: { userId_aulaId: { userId: ctx.userId, aulaId: input.aulaId } },
        create: {
          userId: ctx.userId,
          aulaId: input.aulaId,
          tempoAssistidoS: input.tempoAssistidoS,
        },
        update: { tempoAssistidoS: input.tempoAssistidoS },
      })
      return { ok: true }
    }),
})
