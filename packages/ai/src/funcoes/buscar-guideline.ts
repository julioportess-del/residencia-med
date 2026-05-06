import { prisma } from '@residencia-med/db'
import { gerarEmbedding } from './embedding'

export type GuidelineMatch = {
  id: string
  titulo: string
  fonte: string
  resumo: string
  url: string | null
  similaridade: number
}

export async function buscarGuidelinePorTexto(query: string, k = 5): Promise<GuidelineMatch[]> {
  const embedding = await gerarEmbedding(query)
  const vetorLiteral = `[${embedding.join(',')}]`

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string
      titulo: string
      fonte: string
      resumo: string
      url: string | null
      distancia: number
    }>
  >(
    `SELECT id, titulo, fonte::text, resumo, url,
            (embedding <=> $1::vector) AS distancia
     FROM "Guideline"
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    vetorLiteral,
    k,
  )

  return rows.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    fonte: r.fonte,
    resumo: r.resumo,
    url: r.url,
    similaridade: 1 - r.distancia,
  }))
}
