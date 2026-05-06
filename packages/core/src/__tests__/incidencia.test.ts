import { describe, expect, it } from 'vitest'
import { calcularIncidencia, calcularTendencia, type QuestaoIncidencia } from '../incidencia'

describe('calcularIncidencia', () => {
  it('calcula porcentagem ponderada por banca em janela', () => {
    const questoes: QuestaoIncidencia[] = [
      { questaoId: 'q1', ano: 2024, temas: [{ temaId: 'cardio', peso: 1.0 }] },
      { questaoId: 'q2', ano: 2024, temas: [{ temaId: 'cardio', peso: 1.0 }] },
      { questaoId: 'q3', ano: 2023, temas: [{ temaId: 'pedia', peso: 1.0 }] },
      { questaoId: 'q4', ano: 2023, temas: [{ temaId: 'cardio', peso: 0.5 }] },
    ]
    const resultado = calcularIncidencia(questoes, 2023, 2024)
    const cardio = resultado.find((r) => r.temaId === 'cardio')!
    const pedia = resultado.find((r) => r.temaId === 'pedia')!

    expect(resultado.length).toBe(2)
    expect(cardio.totalPonderado).toBe(2.5) // 1 + 1 + 0.5
    expect(cardio.totalQuestoes).toBe(3)
    expect(pedia.totalPonderado).toBe(1)
    expect(cardio.porcentagem).toBeCloseTo((2.5 / 3.5) * 100, 1)
    expect(pedia.porcentagem).toBeCloseTo((1 / 3.5) * 100, 1)
  })

  it('ordena decrescente por porcentagem', () => {
    const questoes: QuestaoIncidencia[] = [
      { questaoId: 'q1', ano: 2024, temas: [{ temaId: 'A', peso: 1 }] },
      { questaoId: 'q2', ano: 2024, temas: [{ temaId: 'B', peso: 1 }] },
      { questaoId: 'q3', ano: 2024, temas: [{ temaId: 'B', peso: 1 }] },
    ]
    const r = calcularIncidencia(questoes, 2024, 2024)
    expect(r[0]!.temaId).toBe('B')
    expect(r[1]!.temaId).toBe('A')
  })

  it('filtra fora da janela de anos', () => {
    const questoes: QuestaoIncidencia[] = [
      { questaoId: 'q1', ano: 2020, temas: [{ temaId: 'antigo', peso: 1 }] },
      { questaoId: 'q2', ano: 2024, temas: [{ temaId: 'novo', peso: 1 }] },
    ]
    const r = calcularIncidencia(questoes, 2024, 2024)
    expect(r.length).toBe(1)
    expect(r[0]!.temaId).toBe('novo')
  })

  it('lista vazia produz array vazio', () => {
    expect(calcularIncidencia([], 2020, 2024)).toEqual([])
  })
})

describe('calcularTendencia', () => {
  it('calcula delta entre janelas', () => {
    const atual = [
      { temaId: 'A', totalPonderado: 0, totalQuestoes: 0, porcentagem: 30 },
      { temaId: 'B', totalPonderado: 0, totalQuestoes: 0, porcentagem: 10 },
    ]
    const anterior = [
      { temaId: 'A', totalPonderado: 0, totalQuestoes: 0, porcentagem: 20 },
      { temaId: 'B', totalPonderado: 0, totalQuestoes: 0, porcentagem: 15 },
    ]
    const tend = calcularTendencia(atual, anterior)
    expect(tend.get('A')).toBe(10)
    expect(tend.get('B')).toBe(-5)
  })

  it('tema novo (nao existia antes) tem tendencia = porcentagem atual', () => {
    const atual = [{ temaId: 'novo', totalPonderado: 0, totalQuestoes: 0, porcentagem: 8 }]
    const tend = calcularTendencia(atual, [])
    expect(tend.get('novo')).toBe(8)
  })
})
