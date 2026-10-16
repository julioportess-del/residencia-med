import { z } from 'zod'
import { anthropic, MODELO_ANTHROPIC } from '../clients'
import { chaveCacheLLM, getCache, setCache } from '../cache'
import {
  promptClassificarTema,
  VERSAO_CLASSIFICAR_TEMA,
  type PromptClassificarTemaInput,
} from '../prompts/classificar-tema'

const ClassificacaoSchema = z.object({
  codigoTema: z.string().nullable(),
  secundarios: z.array(z.string()).default([]),
  confianca: z.number(),
  justificativa: z.string().default(''),
})

export type ClassificacaoTema = z.infer<typeof ClassificacaoSchema>
export type ClassificarTemaInput = PromptClassificarTemaInput

const FUNCAO = 'classificarTema'
const TTL_CACHE_SEGUNDOS = 60 * 60 * 24 * 30

/** Extrai o primeiro objeto JSON da resposta (tolera cercas ```json e texto em volta). */
export function extrairJsonClassificacao(texto: string): ClassificacaoTema {
  const cercado = texto.match(/```(?:json)?\s*([\s\S]*?)```/)
  const bruto = cercado?.[1] ?? texto.match(/\{[\s\S]*\}/)?.[0]
  if (!bruto) throw new Error('Resposta da IA sem JSON de classificação')
  return ClassificacaoSchema.parse(JSON.parse(bruto))
}

export async function classificarTema(input: ClassificarTemaInput): Promise<ClassificacaoTema> {
  // A taxonomia entra na chave: se temas mudarem, a classificação é refeita.
  const chave = chaveCacheLLM({
    funcao: FUNCAO,
    args: {
      enunciado: input.enunciado,
      vignette: input.vignette ?? '',
      alternativas: input.alternativas ?? [],
      temas: input.temasDisponiveis.map((t) => t.codigo).sort(),
    },
    modelo: MODELO_ANTHROPIC,
    versaoPrompt: VERSAO_CLASSIFICAR_TEMA,
  })

  const cached = await getCache<ClassificacaoTema>(chave)
  if (cached) return cached

  const { system, user } = promptClassificarTema(input)
  const response = await anthropic.messages.create({
    model: MODELO_ANTHROPIC,
    max_tokens: 400,
    temperature: 0,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const texto = response.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')
  const parsed = extrairJsonClassificacao(texto)

  await setCache(chave, parsed, TTL_CACHE_SEGUNDOS)
  return parsed
}
