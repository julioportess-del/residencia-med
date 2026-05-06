import { anthropic, MODELO_ANTHROPIC } from '../clients'
import { chaveCacheLLM, getCache, setCache } from '../cache'
import { promptExplicarErro, VERSAO_EXPLICAR_ERRO } from '../prompts/explicar-erro'

export type ExplicarErroInput = {
  questaoId: string
  enunciado: string
  vignette?: string
  alternativas: Array<{ letra: string; texto: string }>
  gabarito: string
  alternativaEscolhida: string
  guidelinesContexto?: Array<{ titulo: string; fonte: string; resumo: string }>
}

export type ExplicarErroOutput = {
  explicacaoMd: string
  cache: 'hit' | 'miss'
  modelo: string
  versaoPrompt: string
}

const FUNCAO = 'explicarErro'

export async function explicarErro(input: ExplicarErroInput): Promise<ExplicarErroOutput> {
  const chave = chaveCacheLLM({
    funcao: FUNCAO,
    args: {
      questaoId: input.questaoId,
      alternativaEscolhida: input.alternativaEscolhida,
    },
    modelo: MODELO_ANTHROPIC,
    versaoPrompt: VERSAO_EXPLICAR_ERRO,
  })

  const cached = await getCache<ExplicarErroOutput>(chave)
  if (cached) return { ...cached, cache: 'hit' }

  const { system, user } = promptExplicarErro(input)

  const response = await anthropic.messages.create({
    model: MODELO_ANTHROPIC,
    max_tokens: 1024,
    system: [
      { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: user }],
  })

  const explicacaoMd = response.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('\n')

  const out: ExplicarErroOutput = {
    explicacaoMd,
    cache: 'miss',
    modelo: MODELO_ANTHROPIC,
    versaoPrompt: VERSAO_EXPLICAR_ERRO,
  }

  await setCache(chave, out)
  return out
}
