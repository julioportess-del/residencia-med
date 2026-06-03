import { z } from 'zod'
import { anthropic, MODELO_ANTHROPIC } from '../clients'
import { chaveCacheLLM, getCache, setCache } from '../cache'
import { promptClassificarTema, VERSAO_CLASSIFICAR_TEMA } from '../prompts/classificar-tema'

const ClassificacaoSchema = z.array(
  z.object({
    codigoTema: z.string(),
    peso: z.number().min(0).max(1),
    primario: z.boolean(),
  }),
)

export type ClassificacaoTema = z.infer<typeof ClassificacaoSchema>

const FUNCAO = 'classificarTema'

export async function classificarTema(input: {
  enunciado: string
  vignette?: string
  temasDisponiveis: Array<{ codigo: string; nome: string; especialidade: string }>
}): Promise<ClassificacaoTema> {
  const chave = chaveCacheLLM({
    funcao: FUNCAO,
    args: { enunciado: input.enunciado, vignette: input.vignette ?? '' },
    modelo: MODELO_ANTHROPIC,
    versaoPrompt: VERSAO_CLASSIFICAR_TEMA,
  })

  const cached = await getCache<ClassificacaoTema>(chave)
  if (cached) return cached

  const { system, user } = promptClassificarTema(input)
  const response = await anthropic.messages.create({
    model: MODELO_ANTHROPIC,
    max_tokens: 512,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const texto = response.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')

  const match = texto.match(/```json\s*([\s\S]*?)```/) ?? texto.match(/\[[\s\S]*\]/)
  const raw = match ? (Array.isArray(match) ? (match[1] ?? match[0]) : match) : texto
  const parsed = ClassificacaoSchema.parse(JSON.parse(typeof raw === 'string' ? raw : ''))

  await setCache(chave, parsed, 60 * 60 * 24 * 30)
  return parsed
}
