import { anthropic, MODELO_ANTHROPIC } from '../clients'
import { calcularCusto, registrarLLMCall } from '../llm-call'
import { SYSTEM_MENTOR, VERSAO_MENTOR, montarContextoMd, type ContextoEstudante } from '../prompts/mentor'

export type MensagemHistorico = {
  papel: 'USUARIO' | 'ASSISTENTE'
  conteudo: string
}

export type MentorStreamInput = {
  contexto: ContextoEstudante
  historico: MensagemHistorico[]
  novaPergunta: string
  userId: string
  conversaId: string
}

export type MentorStreamResultado = {
  respostaCompleta: string
  inputTokens: number
  outputTokens: number
  custoUsd: number
  latenciaMs: number
}

const FUNCAO = 'mentor'

/**
 * Streaming do mentor virtual.
 * Não usa cache (cada conversa é única). Registra LLMCall ao final.
 */
export async function* mentorStream(
  input: MentorStreamInput,
  onCompleto?: (r: MentorStreamResultado) => void | Promise<void>,
): AsyncGenerator<string, void, unknown> {
  const contextoMd = montarContextoMd(input.contexto)

  const messages = [
    {
      role: 'user' as const,
      content: `Aqui está o contexto atualizado do estudante (use para personalizar suas respostas):\n\n${contextoMd}`,
    },
    {
      role: 'assistant' as const,
      content:
        'Entendi o contexto. Estou pronto para ajudar com dúvidas clínicas, estratégia de estudo ou interpretação de questões. Manda a pergunta.',
    },
    ...input.historico.map((m) => ({
      role: m.papel === 'USUARIO' ? ('user' as const) : ('assistant' as const),
      content: m.conteudo,
    })),
    { role: 'user' as const, content: input.novaPergunta },
  ]

  const inicio = Date.now()
  let acumulado = ''
  let inputTokens = 0
  let outputTokens = 0

  try {
    const stream = anthropic.messages.stream({
      model: MODELO_ANTHROPIC,
      max_tokens: 1500,
      system: SYSTEM_MENTOR,
      messages,
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
      versaoPrompt: VERSAO_MENTOR,
      cacheKey: `mentor:${input.conversaId}:${Date.now()}`,
      cacheHit: false,
      inputTokens,
      outputTokens,
      latenciaMs: latencia,
      custoUsd: custo,
      status: 'sucesso',
      userId: input.userId,
    })

    if (onCompleto) {
      await onCompleto({
        respostaCompleta: acumulado,
        inputTokens,
        outputTokens,
        custoUsd: custo,
        latenciaMs: latencia,
      })
    }
  } catch (e) {
    void registrarLLMCall({
      funcao: FUNCAO,
      modelo: MODELO_ANTHROPIC,
      versaoPrompt: VERSAO_MENTOR,
      cacheKey: `mentor:${input.conversaId}:${Date.now()}`,
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
