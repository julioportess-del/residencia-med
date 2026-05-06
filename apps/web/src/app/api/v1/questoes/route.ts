import { prisma } from '@residencia-med/db'
import { exigeScope, jsonOk, withApiKey } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/v1/questoes
 * Lista questões publicadas com paginação cursor-based.
 * Filtros: ?banca=AMRIGS&ano=2024&dificuldade=MEDIO&limit=50
 */
export const GET = withApiKey(async (req, ctx) => {
  const erro = exigeScope(ctx, 'read')
  if (erro) return erro

  const url = new URL(req.url)
  const banca = url.searchParams.get('banca')
  const ano = url.searchParams.get('ano')
  const dificuldade = url.searchParams.get('dificuldade')
  const limite = Math.min(Number(url.searchParams.get('limit') ?? 50), 200)
  const cursor = url.searchParams.get('cursor') ?? undefined

  const where: Record<string, unknown> = { publicada: true }
  if (banca) where.banca = { codigo: banca.toUpperCase() }
  if (ano) where.ano = Number(ano)
  if (dificuldade) where.dificuldade = dificuldade.toUpperCase()

  const questoes = await prisma.questao.findMany({
    where,
    take: limite + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ ano: 'desc' }, { id: 'asc' }],
    select: {
      id: true,
      ano: true,
      enunciado: true,
      enunciadoVignette: true,
      gabaritoLetra: true,
      dificuldade: true,
      banca: { select: { codigo: true, nome: true } },
      alternativas: {
        orderBy: { ordem: 'asc' },
        select: { letra: true, texto: true, correta: true },
      },
      temas: {
        where: { primario: true },
        select: { tema: { select: { codigo: true, nome: true } } },
        take: 1,
      },
    },
  })

  let proxCursor: string | undefined
  if (questoes.length > limite) {
    const ultimo = questoes.pop()
    proxCursor = ultimo?.id
  }

  return jsonOk({
    itens: questoes.map((q) => ({
      id: q.id,
      ano: q.ano,
      enunciado: q.enunciado,
      vignette: q.enunciadoVignette,
      gabaritoLetra: q.gabaritoLetra,
      dificuldade: q.dificuldade,
      banca: q.banca,
      tema: q.temas[0]?.tema ?? null,
      alternativas: q.alternativas,
    })),
    proxCursor,
    organizationId: ctx.organizationId,
  })
})
