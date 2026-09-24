/**
 * Traduz erros da API de IA (Anthropic SDK) em mensagens acionáveis para
 * o médico/admin, em vez do genérico "Falha ao gerar". Sem isso, causas
 * operacionais (crédito esgotado, chave inválida, rate limit) ficam
 * invisíveis na UI e o problema parece "bug de transcrição".
 */

export interface FalhaIA {
  mensagem: string
  status: number
}

export function mensagemFalhaIA(erro: unknown): FalhaIA {
  const e = erro as { status?: number; message?: string; name?: string }
  const msg = typeof e?.message === 'string' ? e.message : ''

  if (/credit balance is too low|billing|purchase credits/i.test(msg)) {
    return {
      mensagem:
        'Crédito da API de IA (Anthropic) esgotado — recarregue em console.anthropic.com → Billing e tente de novo.',
      status: 402,
    }
  }
  if (e?.status === 401 || /invalid x-api-key|authentication_error/i.test(msg)) {
    return {
      mensagem:
        'Chave da API de IA inválida no servidor — confira ANTHROPIC_API_KEY nas variáveis do Vercel.',
      status: 500,
    }
  }
  if (e?.status === 429 || /rate limit/i.test(msg)) {
    return {
      mensagem: 'Limite de requisições da IA atingido. Aguarde ~1 minuto e tente novamente.',
      status: 429,
    }
  }
  if (e?.status === 529 || /overloaded/i.test(msg)) {
    return {
      mensagem: 'O serviço de IA está sobrecarregado no momento. Tente novamente em instantes.',
      status: 503,
    }
  }
  if (e?.name === 'APIConnectionTimeoutError' || /timeout|timed out/i.test(msg)) {
    return {
      mensagem: 'A geração demorou mais que o limite do servidor. Tente novamente.',
      status: 504,
    }
  }
  // Desconhecido: inclui um resumo curto da causa para diagnóstico na tela.
  const detalhe = [e?.name, msg.slice(0, 140)].filter(Boolean).join(': ')
  return {
    mensagem: `Falha ao gerar a evolução${detalhe ? ` (${detalhe})` : ''}. Tente novamente.`,
    status: 500,
  }
}
