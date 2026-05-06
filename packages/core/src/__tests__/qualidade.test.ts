import { describe, expect, it } from 'vitest'
import { calcularQualidade } from '../qualidade'

describe('calcularQualidade', () => {
  it('errar CONFIANTE -> 0', () => {
    expect(calcularQualidade({ correta: false, tempoSegundos: 60, confianca: 'CONFIANTE' })).toBe(0)
  })

  it('errar INCERTO -> 1', () => {
    expect(calcularQualidade({ correta: false, tempoSegundos: 60, confianca: 'INCERTO' })).toBe(1)
  })

  it('errar CHUTE -> 2', () => {
    expect(calcularQualidade({ correta: false, tempoSegundos: 60, confianca: 'CHUTE' })).toBe(2)
  })

  it('errar sem confianca -> 2', () => {
    expect(calcularQualidade({ correta: false, tempoSegundos: 60 })).toBe(2)
  })

  it('acertar CONFIANTE rapido (<60s) -> 5', () => {
    expect(calcularQualidade({ correta: true, tempoSegundos: 30, confianca: 'CONFIANTE' })).toBe(5)
  })

  it('acertar CONFIANTE devagar -> 4', () => {
    expect(calcularQualidade({ correta: true, tempoSegundos: 90, confianca: 'CONFIANTE' })).toBe(4)
  })

  it('acertar INCERTO -> 3', () => {
    expect(calcularQualidade({ correta: true, tempoSegundos: 60, confianca: 'INCERTO' })).toBe(3)
  })

  it('acertar CHUTE -> 3 (nao reforca demais)', () => {
    expect(calcularQualidade({ correta: true, tempoSegundos: 60, confianca: 'CHUTE' })).toBe(3)
  })
})
