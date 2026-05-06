import { z } from 'zod'
import { anthropic, MODELO_ANTHROPIC } from '../clients'
import { chaveCacheLLM, getCache, setCache } from '../cache'
import { promptGerarQuestao, VERSAO_GERAR_QUESTAO } from '../prompts/gerar-questao'

export const QuestaoGeradaSchema = z.object({
  enunciado: z.string().min(20),
  vignette: z.string().optional(),
  alternativas: z
    .array(
      z.object({
        letra: z.enum(['A', 'B', 'C', 'D', 'E']),
        texto: z.string().min(2),
        correta: z.boolean(),
      }),
    )
    .length(5)
    .refine((arr) => arr.filter((a) => a.correta).length === 1, {
      message: 'Exatamente uma alternativa deve ser correta',
    }),
  gabaritoLetra: z.enum(['A', 'B', 'C', 'D', 'E']),
  explicacaoMd: z.string().min(50),
  dificuldade: z.enum(['FACIL', 'MEDIO', 'DIFICIL', 'MUITO_DIFICIL']),
})

export type QuestaoGerada = z.infer<typeof QuestaoGeradaSchema>

export type GerarQuestaoInput = {
  bancaCodigo: string
  bancaNome: string
  tema: string
  exemplosBanca: Array<{
    enunciado: string
    alternativas: Array<{ letra: string; texto: string; correta: boolean }>
  }>
}

const FUNCAO = 'gerarQuestaoSimilar'

export async function gerarQuestaoSimilar(input: GerarQuestaoInput): Promise<QuestaoGerada> {
  const chave = chaveCacheLLM({
    funcao: FUNCAO,
    args: {
      bancaCodigo: input.bancaCodigo,
      tema: input.tema,
      seed: Date.now() % 1000,
    },
    modelo: MODELO_ANTHROPIC,
    versaoPrompt: VERSAO_GERAR_QUESTAO,
  })

  const cached = await getCache<QuestaoGerada>(chave)
  if (cached) return cached

  const { system, user } = promptGerarQuestao(input)

  // TODO Turno 3: ativar prompt caching via beta header
  const response = await anthropic.messages.create({
    model: MODELO_ANTHROPIC,
    max_tokens: 2048,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const texto = response.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('\n')

  const json = extrairJSON(texto)
  const parsed = QuestaoGeradaSchema.parse(json)

  await setCache(chave, parsed, 60 * 60 * 24 * 7)
  return parsed
}

function extrairJSON(texto: string): unknown {
  const match = texto.match(/```json\s*([\s\S]*?)```/) ?? texto.match(/\{[\s\S]*\}/)
  const raw = match ? (Array.isArray(match) ? match[1] ?? match[0] : match) : texto
  return JSON.parse(typeof raw === 'string' ? raw : '')
}
