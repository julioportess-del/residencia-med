import { addDays } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { aplicarSM2 } from '../spaced-repetition'

const HOJE = new Date('2026-05-05T12:00:00Z')

describe('aplicarSM2', () => {
  it('primeira resposta correta CONFIANTE rapida -> qualidade 5, intervalo 1', () => {
    const r = aplicarSM2(
      null,
      { correta: true, tempoSegundos: 30, confianca: 'CONFIANTE' },
      { hoje: HOJE },
    )
    expect(r.qualidade).toBe(5)
    expect(r.intervalo).toBe(1)
    expect(r.repeticoes).toBe(1)
    expect(r.proximaRevisao).toEqual(addDays(HOJE, 1))
  })

  it('segunda resposta correta apos primeira -> intervalo 6', () => {
    const primeira = aplicarSM2(
      null,
      { correta: true, tempoSegundos: 30, confianca: 'CONFIANTE' },
      { hoje: HOJE },
    )
    const segunda = aplicarSM2(
      primeira,
      { correta: true, tempoSegundos: 30, confianca: 'CONFIANTE' },
      { hoje: addDays(HOJE, 1) },
    )
    expect(segunda.intervalo).toBe(6)
    expect(segunda.repeticoes).toBe(2)
  })

  it('terceira resposta correta -> intervalo cresce com EF', () => {
    let estado = aplicarSM2(
      null,
      { correta: true, tempoSegundos: 30, confianca: 'CONFIANTE' },
      { hoje: HOJE },
    )
    estado = aplicarSM2(
      estado,
      { correta: true, tempoSegundos: 30, confianca: 'CONFIANTE' },
      { hoje: addDays(HOJE, 1) },
    )
    estado = aplicarSM2(
      estado,
      { correta: true, tempoSegundos: 30, confianca: 'CONFIANTE' },
      { hoje: addDays(HOJE, 7) },
    )
    expect(estado.repeticoes).toBe(3)
    expect(estado.intervalo).toBeGreaterThan(6)
  })

  it('erro CONFIANTE reseta repeticoes e intervalo', () => {
    const inicial = aplicarSM2(
      null,
      { correta: true, tempoSegundos: 30, confianca: 'CONFIANTE' },
      { hoje: HOJE },
    )
    const erro = aplicarSM2(
      inicial,
      { correta: false, tempoSegundos: 80, confianca: 'CONFIANTE' },
      { hoje: addDays(HOJE, 1) },
    )
    expect(erro.qualidade).toBe(0)
    expect(erro.repeticoes).toBe(0)
    expect(erro.intervalo).toBe(1)
  })

  it('chute correto da qualidade 3, nao maxima', () => {
    const r = aplicarSM2(
      null,
      { correta: true, tempoSegundos: 30, confianca: 'CHUTE' },
      { hoje: HOJE },
    )
    expect(r.qualidade).toBe(3)
  })

  it('teto de intervalo aplicado proximo da prova (<30 dias)', () => {
    let estado = aplicarSM2(
      null,
      { correta: true, tempoSegundos: 30, confianca: 'CONFIANTE' },
      { hoje: HOJE },
    )
    estado = {
      intervalo: 30,
      repeticoes: 5,
      fatorFacilidade: 2.6,
      qualidade: 5,
      ultimaRevisao: HOJE,
      proximaRevisao: addDays(HOJE, 30),
    }
    const dataProva = addDays(HOJE, 20) // 20 dias <30
    const r = aplicarSM2(
      estado,
      { correta: true, tempoSegundos: 30, confianca: 'CONFIANTE' },
      { hoje: HOJE, dataProva },
    )
    expect(r.intervalo).toBeLessThanOrEqual(7)
  })

  it('teto agressivo proximo da prova (<7 dias)', () => {
    const estado = {
      intervalo: 30,
      repeticoes: 5,
      fatorFacilidade: 2.6,
      qualidade: 5,
      ultimaRevisao: HOJE,
      proximaRevisao: addDays(HOJE, 30),
    }
    const dataProva = addDays(HOJE, 5)
    const r = aplicarSM2(
      estado,
      { correta: true, tempoSegundos: 30, confianca: 'CONFIANTE' },
      { hoje: HOJE, dataProva },
    )
    expect(r.intervalo).toBeLessThanOrEqual(2)
  })

  it('EF nunca cai abaixo de 1.3', () => {
    let estado: ReturnType<typeof aplicarSM2> | null = null
    for (let i = 0; i < 20; i++) {
      estado = aplicarSM2(
        estado,
        { correta: false, tempoSegundos: 200, confianca: 'CONFIANTE' },
        { hoje: addDays(HOJE, i) },
      )
    }
    expect(estado!.fatorFacilidade).toBeGreaterThanOrEqual(1.3)
  })
})
