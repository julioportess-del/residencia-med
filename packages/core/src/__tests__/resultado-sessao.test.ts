import { describe, expect, it } from 'vitest'
import { analisarSessao, type RespostaSessao } from '../resultado-sessao'

const r = (
  questaoId: string,
  correta: boolean,
  extra: Partial<RespostaSessao> = {},
): RespostaSessao => ({
  questaoId,
  correta,
  tempoSegundos: 60,
  confianca: 'INCERTO',
  area: 'Pediatria',
  dificuldade: 'MEDIO',
  respondidaEm: new Date('2026-10-16T12:00:00Z'),
  ...extra,
})

describe('analisarSessao', () => {
  it('conta em branco a partir das questões planejadas', () => {
    const a = analisarSessao(['q1', 'q2', 'q3'], [r('q1', true), r('q2', false)])
    expect(a.planejadas).toBe(3)
    expect(a.respondidas).toBe(2)
    expect(a.emBranco).toBe(1)
    expect(a.acertos).toBe(1)
    expect(a.taxa).toBeCloseTo(0.5)
  })

  it('considera só a PRIMEIRA resposta de cada questão na sessão', () => {
    const a = analisarSessao(
      ['q1'],
      [
        r('q1', true, { respondidaEm: new Date('2026-10-16T12:05:00Z') }),
        r('q1', false, { respondidaEm: new Date('2026-10-16T12:00:00Z') }),
      ],
    )
    expect(a.respondidas).toBe(1)
    expect(a.acertos).toBe(0)
  })

  it('agrupa por área, dificuldade e confiança; sem área vira "Não classificada"', () => {
    const a = analisarSessao(
      ['q1', 'q2', 'q3'],
      [
        r('q1', true, { area: 'GO', confianca: 'CONFIANTE' }),
        r('q2', false, { area: null, confianca: 'CONFIANTE', dificuldade: 'DIFICIL' }),
        r('q3', true, { area: 'GO', confianca: 'CHUTE' }),
      ],
    )
    expect(a.porArea.find((x) => x.chave === 'GO')).toMatchObject({ total: 2, acertos: 2 })
    expect(a.porArea.find((x) => x.chave === 'Não classificada')).toMatchObject({ total: 1 })
    expect(a.porDificuldade.find((x) => x.chave === 'DIFICIL')).toMatchObject({
      total: 1,
      acertos: 0,
    })
    expect(a.porConfianca.find((x) => x.chave === 'CONFIANTE')).toMatchObject({
      total: 2,
      acertos: 1,
    })
  })

  it('tempo total, médio e as mais demoradas', () => {
    const a = analisarSessao(
      ['q1', 'q2'],
      [r('q1', true, { tempoSegundos: 30 }), r('q2', true, { tempoSegundos: 210 })],
    )
    expect(a.tempoTotalSegundos).toBe(240)
    expect(a.tempoMedioSegundos).toBe(120)
    expect(a.maisDemoradas[0]?.questaoId).toBe('q2')
  })

  it('sessão vazia não divide por zero', () => {
    const a = analisarSessao(['q1'], [])
    expect(a.taxa).toBe(0)
    expect(a.tempoMedioSegundos).toBe(0)
  })
})
