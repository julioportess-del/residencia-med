import { describe, expect, it } from 'vitest'
import { interpretarConfianca } from '../confianca'

describe('interpretarConfianca', () => {
  it('certeza + erro = possível falsa compreensão (alerta)', () => {
    const r = interpretarConfianca('CONFIANTE', false)
    expect(r.categoria).toBe('FALSA_COMPREENSAO')
    expect(r.gravidade).toBe('alta')
  })

  it('dúvida + acerto = conhecimento parcial', () => {
    expect(interpretarConfianca('INCERTO', true).categoria).toBe('PARCIAL')
  })

  it('chute + acerto não conta como domínio', () => {
    const r = interpretarConfianca('CHUTE', true)
    expect(r.categoria).toBe('ACERTO_SEM_DOMINIO')
    expect(r.contaComoDominio).toBe(false)
  })

  it('certeza + acerto = domínio provável, sujeito a confirmação', () => {
    const r = interpretarConfianca('CONFIANTE', true)
    expect(r.categoria).toBe('DOMINIO_PROVAVEL')
    expect(r.contaComoDominio).toBe(true)
  })

  it('dúvida ou chute + erro = lacuna reconhecida', () => {
    expect(interpretarConfianca('INCERTO', false).categoria).toBe('LACUNA')
    expect(interpretarConfianca('CHUTE', false).categoria).toBe('LACUNA')
  })

  it('sem confiança registrada → só o resultado', () => {
    expect(interpretarConfianca(null, true).categoria).toBe('SEM_REGISTRO')
  })
})
