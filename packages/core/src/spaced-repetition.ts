import { addDays, differenceInDays } from 'date-fns'
import { calcularQualidade, type Resposta } from './qualidade'

export type ItemRevisaoEstado = {
  intervalo: number
  repeticoes: number
  fatorFacilidade: number
  qualidade: number | null
  ultimaRevisao: Date | null
  proximaRevisao: Date
}

export type ContextoRevisao = {
  dataProva?: Date | null
  hoje?: Date
}

const EF_MIN = 1.3
const EF_DEFAULT = 2.5

/**
 * SM-2 modificado.
 * - Recebe estado anterior (ou null) + nova resposta.
 * - Retorna novo estado.
 *
 * Modificacoes vs SM-2 puro:
 * 1. qualidade derivada de (correta, tempo, confianca)
 * 2. teto de intervalo proximo da prova
 *
 * Doc: docs/adr/0005-spaced-repetition-sm2-modified.md
 */
export function aplicarSM2(
  estadoAnterior: ItemRevisaoEstado | null,
  resposta: Resposta,
  ctx: ContextoRevisao = {},
): ItemRevisaoEstado {
  const hoje = ctx.hoje ?? new Date()
  const q = calcularQualidade(resposta)

  let intervalo: number
  let repeticoes: number
  let ef: number

  if (estadoAnterior === null) {
    repeticoes = q < 3 ? 0 : 1
    intervalo = q < 3 ? 1 : 1
    ef = EF_DEFAULT
  } else {
    ef = estadoAnterior.fatorFacilidade
    if (q < 3) {
      repeticoes = 0
      intervalo = 1
    } else {
      repeticoes = estadoAnterior.repeticoes + 1
      if (estadoAnterior.repeticoes === 0) intervalo = 1
      else if (estadoAnterior.repeticoes === 1) intervalo = 6
      else intervalo = Math.round(estadoAnterior.intervalo * ef)
    }
  }

  ef = Math.max(EF_MIN, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

  if (ctx.dataProva) {
    const dias = differenceInDays(ctx.dataProva, hoje)
    if (dias < 7) intervalo = Math.min(intervalo, 2)
    else if (dias < 30) intervalo = Math.min(intervalo, 7)
  }

  return {
    intervalo,
    repeticoes,
    fatorFacilidade: ef,
    qualidade: q,
    ultimaRevisao: hoje,
    proximaRevisao: addDays(hoje, intervalo),
  }
}
