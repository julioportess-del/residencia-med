import { anthropic, MODELO_ANTHROPIC } from '../clients'
import { chaveCacheLLM, getCache, setCache } from '../cache'
import { calcularCusto, registrarLLMCall } from '../llm-call'
import { promptExplicarErro, VERSAO_EXPLICAR_ERRO } from '../prompts/explicar-erro'

export type ExplicarErroInput = {
  questaoId: string
  enunciado: string
  vignette?: string
  alternativas: Array<{ letra: string; texto: string }>
  gabarito: string
  alternativaEscolhida: string
  guidelinesContexto?: Array<{ titulo: string; fonte: string; resumo: string }>
  userId?: string
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

  const cached = await getCache<{ explicacaoMd: string }>(chave)
  if (cached) {
    void registrarLLMCall({
      funcao: FUNCAO,
      modelo: MODELO_ANTHROPIC,
      versaoPrompt: VERSAO_EXPLICAR_ERRO,
      cacheKey: chave,
      cacheHit: true,
      inputTokens: 0,
      outputTokens: 0,
      latenciaMs: 0,
      custoUsd: 0,
      status: 'sucesso',
      userId: input.userId,
    })
    return {
      explicacaoMd: cached.explicacaoMd,
      cache: 'hit',
      modelo: MODELO_ANTHROPIC,
      versaoPrompt: VERSAO_EXPLICAR_ERRO,
    }
  }

  const { system, user } = promptExplicarErro(input)

  const inicio = Date.now()
  try {
    const response = await anthropic.messages.create({
      model: MODELO_ANTHROPIC,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    })

    const explicacaoMd = response.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n')

    const latencia = Date.now() - inicio
    const custo = calcularCusto(
      MODELO_ANTHROPIC,
      response.usage.input_tokens,
      response.usage.output_tokens,
    )

    void registrarLLMCall({
      funcao: FUNCAO,
      modelo: MODELO_ANTHROPIC,
      versaoPrompt: VERSAO_EXPLICAR_ERRO,
      cacheKey: chave,
      cacheHit: false,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latenciaMs: latencia,
      custoUsd: custo,
      status: 'sucesso',
      userId: input.userId,
    })

    await setCache(chave, { explicacaoMd })
    return {
      explicacaoMd,
      cache: 'miss',
      modelo: MODELO_ANTHROPIC,
      versaoPrompt: VERSAO_EXPLICAR_ERRO,
    }
  } catch (e) {
    void registrarLLMCall({
      funcao: FUNCAO,
      modelo: MODELO_ANTHROPIC,
      versaoPrompt: VERSAO_EXPLICAR_ERRO,
      cacheKey: chave,
      cacheHit: false,
      inputTokens: 0,
      outputTokens: 0,
      latenciaMs: Date.now() - inicio,
      custoUsd: 0,
      status: 'erro_provider',
      erro: (e as Error).message,
      userId: input.userId,
    })
    throw e
  }
}

/**
 * Versao streaming. Retorna async iterable de chunks de texto.
 * Cache check de cabecalho — se hit, retorna o texto completo em um chunk.
 * Se miss, abre stream com Claude e persiste resultado completo no fim.
 */
export async function* explicarErroStream(
  input: ExplicarErroInput,
): AsyncGenerator<string, void, unknown> {
  const chave = chaveCacheLLM({
    funcao: FUNCAO,
    args: {
      questaoId: input.questaoId,
      alternativaEscolhida: input.alternativaEscolhida,
    },
    modelo: MODELO_ANTHROPIC,
    versaoPrompt: VERSAO_EXPLICAR_ERRO,
  })

  const cached = await getCache<{ explicacaoMd: string }>(chave)
  if (cached) {
    void registrarLLMCall({
      funcao: FUNCAO,
      modelo: MODELO_ANTHROPIC,
      versaoPrompt: VERSAO_EXPLICAR_ERRO,
      cacheKey: chave,
      cacheHit: true,
      inputTokens: 0,
      outputTokens: 0,
      latenciaMs: 0,
      custoUsd: 0,
      status: 'sucesso',
      userId: input.userId,
    })
    yield cached.explicacaoMd
    return
  }

  const { system, user } = promptExplicarErro(input)
  const inicio = Date.now()
  let acumulado = ''
  let inputTokens = 0
  let outputTokens = 0

  try {
    const stream = anthropic.messages.stream({
      model: MODELO_ANTHROPIC,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const chunk = event.delta.text
        acumulado += chunk
        yield chunk
      }
      if (event.type === 'message_start') {
        inputTokens = event.message.usage.input_tokens
      }
      if (event.type === 'message_delta') {
        outputTokens = event.usage.output_tokens
      }
    }

    const latencia = Date.now() - inicio
    const custo = calcularCusto(MODELO_ANTHROPIC, inputTokens, outputTokens)

    void registrarLLMCall({
      funcao: FUNCAO,
      modelo: MODELO_ANTHROPIC,
      versaoPrompt: VERSAO_EXPLICAR_ERRO,
      cacheKey: chave,
      cacheHit: false,
      inputTokens,
      outputTokens,
      latenciaMs: latencia,
      custoUsd: custo,
      status: 'sucesso',
      userId: input.userId,
    })

    await setCache(chave, { explicacaoMd: acumulado })
  } catch (e) {
    void registrarLLMCall({
      funcao: FUNCAO,
      modelo: MODELO_ANTHROPIC,
      versaoPrompt: VERSAO_EXPLICAR_ERRO,
      cacheKey: chave,
      cacheHit: false,
      inputTokens,
      outputTokens,
      latenciaMs: Date.now() - inicio,
      custoUsd: 0,
      status: 'erro_provider',
      erro: (e as Error).message,
      userId: input.userId,
    })
    throw e
  }
}
