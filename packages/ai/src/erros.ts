/**
 * Traduz falhas da API de IA em mensagem curta em português para o usuário.
 * Nunca expõe o JSON bruto do provedor; o detalhe técnico fica no log do servidor.
 */
export function mensagemErroIA(erro: unknown): string {
  const texto = erro instanceof Error ? erro.message : String(erro)
  const t = texto.toLowerCase()

  if (t.includes('usage limit') || t.includes('credit balance')) {
    return 'A IA está indisponível: o limite de uso da conta da Anthropic foi atingido. Ajuste o limite ou recarregue créditos no console da Anthropic e tente de novo.'
  }
  if (t.includes('rate_limit') || t.includes('429')) {
    return 'Muitas solicitações à IA em pouco tempo. Aguarde um minuto e tente de novo.'
  }
  if (t.includes('overloaded') || t.includes('529') || t.includes('503')) {
    return 'A IA está sobrecarregada no momento. Tente de novo em alguns minutos.'
  }
  if (t.includes('authentication') || t.includes('401') || t.includes('api key')) {
    return 'A IA não está configurada corretamente (chave de API inválida).'
  }
  return 'Não foi possível gerar a explicação agora. Tente de novo em instantes.'
}
