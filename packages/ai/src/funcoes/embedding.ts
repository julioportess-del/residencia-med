import { openai, MODELO_EMBEDDING } from '../clients'

export async function gerarEmbedding(texto: string): Promise<number[]> {
  const r = await openai.embeddings.create({
    model: MODELO_EMBEDDING,
    input: texto,
  })
  const primeiro = r.data[0]
  if (!primeiro) throw new Error('OpenAI nao retornou embedding')
  return primeiro.embedding
}

export async function gerarEmbeddings(textos: string[]): Promise<number[][]> {
  if (textos.length === 0) return []
  const r = await openai.embeddings.create({ model: MODELO_EMBEDDING, input: textos })
  return r.data.map((d) => d.embedding)
}
