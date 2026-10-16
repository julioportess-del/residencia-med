import { anthropic } from '../clients'
import type { RequisicaoLote } from './comentar-questao'

export type ResultadoLote = {
  customId: string
  ok: boolean
  texto: string
  erro?: string
  tokensEntrada: number
  tokensSaida: number
}

export type EstadoLote = {
  id: string
  status: 'in_progress' | 'canceling' | 'ended'
  contagem: { processando: number; ok: number; erro: number; cancelado: number; expirado: number }
}

/** Envia requisições para a Message Batches API (50% do preço; processa em até 24 h). */
export async function enviarLote(requisicoes: RequisicaoLote[]): Promise<string> {
  const lote = await anthropic.messages.batches.create({ requests: requisicoes })
  return lote.id
}

export async function consultarLote(id: string): Promise<EstadoLote> {
  const lote = await anthropic.messages.batches.retrieve(id)
  return {
    id: lote.id,
    status: lote.processing_status,
    contagem: {
      processando: lote.request_counts.processing,
      ok: lote.request_counts.succeeded,
      erro: lote.request_counts.errored,
      cancelado: lote.request_counts.canceled,
      expirado: lote.request_counts.expired,
    },
  }
}

export async function lerResultadosLote(id: string): Promise<ResultadoLote[]> {
  const saida: ResultadoLote[] = []
  for await (const item of await anthropic.messages.batches.results(id)) {
    if (item.result.type === 'succeeded') {
      const msg = item.result.message
      saida.push({
        customId: item.custom_id,
        ok: true,
        texto: msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n'),
        tokensEntrada: msg.usage.input_tokens,
        tokensSaida: msg.usage.output_tokens,
      })
    } else {
      saida.push({
        customId: item.custom_id,
        ok: false,
        texto: '',
        erro: item.result.type === 'errored' ? JSON.stringify(item.result.error) : item.result.type,
        tokensEntrada: 0,
        tokensSaida: 0,
      })
    }
  }
  return saida
}
