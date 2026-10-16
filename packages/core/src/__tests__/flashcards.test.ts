import { describe, expect, it } from 'vitest'
import {
  cartaoNovo,
  preverIntervalos,
  revisarCartao,
  rotuloIntervalo,
  RETENCAO_PADRAO,
  type EstadoCartao,
} from '../flashcards'

const AGORA = new Date('2026-10-16T12:00:00Z')

describe('flashcards (FSRS)', () => {
  it('cartão novo está vencido agora e é NOVO', () => {
    const c = cartaoNovo(AGORA)
    expect(c.estado).toBe('NOVO')
    expect(c.vencimento.getTime()).toBe(AGORA.getTime())
    expect(c.repeticoes).toBe(0)
  })

  it('"Bom" agenda para depois de "Errei" e "Fácil" para depois de "Bom"', () => {
    const c = cartaoNovo(AGORA)
    const p = preverIntervalos(c, AGORA)
    expect(p.ERREI.getTime()).toBeLessThan(p.BOM.getTime())
    expect(p.BOM.getTime()).toBeLessThanOrEqual(p.FACIL.getTime())
  })

  it('errar um cartão em revisão conta lapso e o devolve para reaprendizagem', () => {
    let c: EstadoCartao = cartaoNovo(AGORA)
    let t = AGORA
    for (let i = 0; i < 4; i++) {
      c = revisarCartao(c, 'BOM', t).cartao
      t = new Date(c.vencimento.getTime() + 1000)
    }
    expect(c.estado).toBe('REVISAO')
    const depois = revisarCartao(c, 'ERREI', t).cartao
    expect(depois.lapsos).toBe(c.lapsos + 1)
    expect(depois.estado).toBe('REAPRENDENDO')
  })

  it('não muta o cartão de entrada e registra log da revisão', () => {
    const c = cartaoNovo(AGORA)
    const copia = { ...c }
    const { log } = revisarCartao(c, 'DIFICIL', AGORA)
    expect(c).toEqual(copia)
    expect(log.nota).toBe('DIFICIL')
  })

  it('retenção alvo padrão de 90%', () => {
    expect(RETENCAO_PADRAO).toBe(0.9)
  })
})

describe('rotuloIntervalo', () => {
  const t0 = new Date('2026-10-16T12:00:00Z')
  it('formata minutos, horas, dias e meses', () => {
    expect(rotuloIntervalo(t0, new Date(t0.getTime() + 10 * 60_000))).toBe('10 min')
    expect(rotuloIntervalo(t0, new Date(t0.getTime() + 5 * 3_600_000))).toBe('5 h')
    expect(rotuloIntervalo(t0, new Date(t0.getTime() + 3 * 86_400_000))).toBe('3 dias')
    expect(rotuloIntervalo(t0, new Date(t0.getTime() + 60 * 86_400_000))).toBe('2 meses')
  })
})
