import { z } from 'zod'
import {
  promptComentarQuestao,
  VERSAO_COMENTAR_QUESTAO,
  type PromptComentarQuestaoInput,
} from '../prompts/comentar-questao'
import { promptClassificarTema, type PromptClassificarTemaInput } from '../prompts/classificar-tema'

/**
 * Processamento em LOTE (Message Batches API, 50% mais barata) para comentar
 * e classificar questões oficiais. Comentário é conteúdo GERADO POR IA e deve
 * ser exibido com esse rótulo até revisão humana.
 */

export const MODELO_COMENTARIO_LOTE = 'claude-opus-5-5'
export const MODELO_CLASSIFICACAO_LOTE = 'claude-sonnet-5-5'
export { VERSAO_COMENTAR_QUESTAO }

const ComentarioSchema = z.object({
  gabaritoConcorda: z.boolean(),
  divergencia: z.string().nullable(),
  dependeImagem: z.boolean().default(false),
  resumo: z.string().min(1),
  conceitoPrincipal: z.string().min(1),
  pegadinha: z.string().nullable(),
  alternativas: z.array(z.object({ letra: z.string(), comentario: z.string().min(1) })),
  referencia: z.string().nullable(),
  assuntosRelacionados: z.array(z.string()).max(5).default([]),
  flashcard: z.object({ frente: z.string().min(1), verso: z.string().min(1) }),
})

export type ComentarioQuestao = z.infer<typeof ComentarioSchema>

/** Lê o comentário salvo no banco (Json). Devolve null se ausente ou fora do formato. */
export function lerComentarioIa(valor: unknown): ComentarioQuestao | null {
  if (valor == null) return null
  const r = ComentarioSchema.safeParse(valor)
  return r.success ? r.data : null
}

function extrairJson(texto: string): unknown {
  const cercado = texto.match(/```(?:json)?\s*([\s\S]*?)```/)
  const bruto = cercado?.[1] ?? texto.match(/\{[\s\S]*\}/)?.[0]
  if (!bruto) throw new Error('Resposta da IA sem JSON')
  return JSON.parse(bruto)
}

/** Valida a resposta e garante que TODAS as alternativas foram comentadas. */
export function extrairComentario(texto: string, letrasEsperadas: string[]): ComentarioQuestao {
  const comentario = ComentarioSchema.parse(extrairJson(texto))
  const comentadas = new Set(comentario.alternativas.map((a) => a.letra.trim().toUpperCase()))
  const faltando = letrasEsperadas.filter((l) => !comentadas.has(l))
  if (faltando.length > 0) {
    throw new Error(`Alternativas sem comentário: ${faltando.join(', ')}`)
  }
  return comentario
}

export type RequisicaoLote = {
  custom_id: string
  params: {
    model: string
    max_tokens: number
    system: string
    messages: Array<{ role: 'user'; content: string }>
  }
}

export function montarRequisicaoComentario(
  questaoId: string,
  input: PromptComentarQuestaoInput,
): RequisicaoLote {
  const { system, user } = promptComentarQuestao(input)
  return {
    custom_id: `comentar-${questaoId}`,
    params: {
      model: MODELO_COMENTARIO_LOTE,
      max_tokens: 3000,
      system,
      messages: [{ role: 'user', content: user }],
    },
  }
}

export function montarRequisicaoClassificacao(
  questaoId: string,
  input: PromptClassificarTemaInput,
): RequisicaoLote {
  const { system, user } = promptClassificarTema(input)
  return {
    custom_id: `classificar-${questaoId}`,
    params: {
      model: MODELO_CLASSIFICACAO_LOTE,
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: user }],
    },
  }
}
