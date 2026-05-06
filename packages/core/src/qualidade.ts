import type { Confianca } from '@residencia-med/types'

export type Resposta = {
  correta: boolean
  tempoSegundos: number
  confianca?: Confianca
}

/**
 * Deriva qualidade SM-2 (0..5) a partir de (correta, tempo, confianca).
 * Doc: docs/adr/0005-spaced-repetition-sm2-modified.md
 */
export function calcularQualidade(resposta: Resposta): number {
  if (!resposta.correta) {
    if (resposta.confianca === 'CONFIANTE') return 0
    if (resposta.confianca === 'INCERTO') return 1
    return 2
  }
  const rapidoOk = resposta.tempoSegundos < 60
  if (resposta.confianca === 'CONFIANTE' && rapidoOk) return 5
  if (resposta.confianca === 'CONFIANTE') return 4
  if (resposta.confianca === 'INCERTO') return 3
  if (resposta.confianca === 'CHUTE') return 3
  return 4
}
