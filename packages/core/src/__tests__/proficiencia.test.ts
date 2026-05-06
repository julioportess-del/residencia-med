import { describe, expect, it } from 'vitest'
import { calcularProficiencia, type RespostaParaProficiencia } from '../proficiencia'

const r = (
  correta: boolean,
  dificuldade: 'FACIL' | 'MEDIO' | 'DIFICIL' | 'MUITO_DIFICIL',
  especialidadeId: string,
  nome = 'Esp ' + especialidadeId,
): RespostaParaProficiencia => ({ correta, dificuldade, especialidadeId, especialidadeNome: nome })

describe('calcularProficiencia', () => {
  it('lista vazia → score 0', () => {
    const res = calcularProficiencia([])
    expect(res.scoreGlobal).toBe(0)
    expect(res.porEspecialidade).toEqual([])
  })

  it('100% acerto em FÁCIL → score 100', () => {
    const res = calcularProficiencia([r(true, 'FACIL', 'a'), r(true, 'FACIL', 'a')])
    expect(res.scoreGlobal).toBe(100)
  })

  it('0% acerto → score 0', () => {
    const res = calcularProficiencia([r(false, 'MEDIO', 'a'), r(false, 'DIFICIL', 'a')])
    expect(res.scoreGlobal).toBe(0)
  })

  it('acertar fácil tem peso menor que difícil', () => {
    const apenasFacilCerto = calcularProficiencia([
      r(true, 'FACIL', 'a'),
      r(false, 'DIFICIL', 'a'),
    ])
    const apenasDificilCerto = calcularProficiencia([
      r(false, 'FACIL', 'a'),
      r(true, 'DIFICIL', 'a'),
    ])
    expect(apenasDificilCerto.scoreGlobal).toBeGreaterThan(apenasFacilCerto.scoreGlobal)
  })

  it('agrupa por especialidade corretamente', () => {
    const res = calcularProficiencia([
      r(true, 'MEDIO', 'cardio', 'Cardiologia'),
      r(true, 'MEDIO', 'cardio'),
      r(false, 'MEDIO', 'pedia', 'Pediatria'),
    ])
    const cardio = res.porEspecialidade.find((e) => e.especialidadeId === 'cardio')
    const pedia = res.porEspecialidade.find((e) => e.especialidadeId === 'pedia')
    expect(cardio?.score).toBe(100)
    expect(pedia?.score).toBe(0)
  })

  it('score por especialidade é independente, score global é ponderado por peso', () => {
    const res = calcularProficiencia([
      r(true, 'FACIL', 'a'), // peso 1
      r(true, 'FACIL', 'a'), // peso 1
      r(false, 'MUITO_DIFICIL', 'b'), // peso 4
    ])
    const a = res.porEspecialidade.find((e) => e.especialidadeId === 'a')
    const b = res.porEspecialidade.find((e) => e.especialidadeId === 'b')
    expect(a?.score).toBe(100)
    expect(b?.score).toBe(0)
    // Score global = (100*2 + 0*4) / 6 = 33.33
    expect(res.scoreGlobal).toBeCloseTo(33.3, 1)
  })

  it('ordena por pesoTotal descendente (mais expostas primeiro)', () => {
    const res = calcularProficiencia([
      r(true, 'FACIL', 'a'),
      r(true, 'FACIL', 'a'),
      r(true, 'FACIL', 'a'),
      r(true, 'DIFICIL', 'b'),
    ])
    expect(res.porEspecialidade[0]?.especialidadeId).toBe('a')
  })

  it('totalRespostas conta todas', () => {
    const res = calcularProficiencia([
      r(true, 'FACIL', 'a'),
      r(false, 'MEDIO', 'b'),
      r(true, 'DIFICIL', 'a'),
    ])
    expect(res.totalRespostas).toBe(3)
  })
})
