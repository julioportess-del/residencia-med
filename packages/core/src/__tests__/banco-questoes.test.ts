import { describe, expect, it } from 'vitest'
import {
  embaralhar,
  LISTAS_INTELIGENTES,
  restricaoPorSituacao,
  resumirHistorico,
  type RespostaHistorico,
} from '../banco-questoes'

const r = (
  questaoId: string,
  correta: boolean,
  confianca: RespostaHistorico['confianca'],
  dia: number,
): RespostaHistorico => ({
  questaoId,
  correta,
  confianca,
  createdAt: new Date(Date.UTC(2026, 9, dia)),
})

describe('resumirHistorico', () => {
  it('usa a ÚLTIMA tentativa para o estado atual e guarda se já errou', () => {
    const h = resumirHistorico([r('q1', false, 'CONFIANTE', 1), r('q1', true, 'INCERTO', 5)])
    const q1 = h.get('q1')!
    expect(q1.tentativas).toBe(2)
    expect(q1.ultimaCorreta).toBe(true)
    expect(q1.ultimaConfianca).toBe('INCERTO')
    expect(q1.jaErrou).toBe(true)
  })

  it('ordem de chegada não importa', () => {
    const h = resumirHistorico([r('q1', true, 'CHUTE', 9), r('q1', false, null, 2)])
    expect(h.get('q1')!.ultimaCorreta).toBe(true)
  })
})

describe('restricaoPorSituacao', () => {
  const h = resumirHistorico([
    r('errada', false, 'INCERTO', 1),
    r('certa', true, 'CONFIANTE', 1),
    r('chute', true, 'CHUTE', 1),
    r('falsa', false, 'CONFIANTE', 1),
    r('corrigida', false, 'CONFIANTE', 1),
    r('corrigida', true, 'CONFIANTE', 3),
  ])

  it('TODAS não restringe', () => {
    expect(restricaoPorSituacao('TODAS', h, [])).toEqual({ tipo: 'nenhuma' })
  })

  it('INEDITAS exclui todas as já respondidas', () => {
    const res = restricaoPorSituacao('INEDITAS', h, [])
    expect(res.tipo).toBe('excluir')
    if (res.tipo === 'excluir')
      expect(res.ids.sort()).toEqual(['certa', 'chute', 'corrigida', 'errada', 'falsa'])
  })

  it('ERRADAS = última tentativa errada', () => {
    expect(restricaoPorSituacao('ERRADAS', h, [])).toEqual({
      tipo: 'incluir',
      ids: ['errada', 'falsa'],
    })
  })

  it('ACERTADAS = última tentativa certa', () => {
    const res = restricaoPorSituacao('ACERTADAS', h, [])
    if (res.tipo === 'incluir') expect(res.ids.sort()).toEqual(['certa', 'chute', 'corrigida'])
  })

  it('CHUTES_CERTOS = acertou no chute', () => {
    expect(restricaoPorSituacao('CHUTES_CERTOS', h, [])).toEqual({
      tipo: 'incluir',
      ids: ['chute'],
    })
  })

  it('CERTEZA_ERRADA = errou com certeza (última tentativa)', () => {
    expect(restricaoPorSituacao('CERTEZA_ERRADA', h, [])).toEqual({
      tipo: 'incluir',
      ids: ['falsa'],
    })
  })

  it('REVISAO_VENCIDA usa a lista de itens vencidos', () => {
    expect(restricaoPorSituacao('REVISAO_VENCIDA', h, ['x', 'y'])).toEqual({
      tipo: 'incluir',
      ids: ['x', 'y'],
    })
  })
})

describe('embaralhar', () => {
  it('é uma permutação sem perder ou duplicar itens', () => {
    const itens = Array.from({ length: 50 }, (_, i) => `q${i}`)
    const res = embaralhar(itens)
    expect(res).toHaveLength(50)
    expect(new Set(res).size).toBe(50)
    expect([...res].sort()).toEqual([...itens].sort())
  })

  it('não altera o array original e é determinístico com rng fixo', () => {
    const itens = ['a', 'b', 'c', 'd']
    const rng = () => 0
    expect(embaralhar(itens, rng)).toEqual(embaralhar(itens, rng))
    expect(itens).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('LISTAS_INTELIGENTES', () => {
  it('ids únicos e todas com título e situação', () => {
    const ids = LISTAS_INTELIGENTES.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const l of LISTAS_INTELIGENTES) expect(l.titulo.length).toBeGreaterThan(0)
  })
})
