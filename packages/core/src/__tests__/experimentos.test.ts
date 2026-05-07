import { describe, expect, test } from 'vitest'
import {
  calcularResultados,
  escolherVariante,
  hashString,
  variantesValidas,
} from '../experimentos'

describe('hashString', () => {
  test('produz uint32 estável para a mesma entrada', () => {
    const a = hashString('user-123')
    const b = hashString('user-123')
    expect(a).toBe(b)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThan(2 ** 32)
  })

  test('produz hashes diferentes para entradas diferentes', () => {
    expect(hashString('a')).not.toBe(hashString('b'))
    expect(hashString('user-1')).not.toBe(hashString('user-2'))
  })
})

describe('escolherVariante', () => {
  const variantes = [
    { nome: 'A', peso: 50 },
    { nome: 'B', peso: 50 },
  ]

  test('é determinística para mesmo (experimento, user)', () => {
    const v1 = escolherVariante('teste-cta', 'user-42', variantes)
    const v2 = escolherVariante('teste-cta', 'user-42', variantes)
    expect(v1).toBe(v2)
  })

  test('experimentos diferentes podem dar variantes diferentes para o mesmo user', () => {
    const todos = new Set<string>()
    for (let i = 0; i < 50; i++) {
      todos.add(escolherVariante(`exp-${i}`, 'user-1', variantes))
    }
    expect(todos.size).toBeGreaterThan(1)
  })

  test('com pesos 50/50, distribui aproximadamente metade-metade em populações grandes', () => {
    const total = 5000
    let qtdA = 0
    for (let i = 0; i < total; i++) {
      if (escolherVariante('exp1', `u${i}`, variantes) === 'A') qtdA++
    }
    expect(qtdA / total).toBeGreaterThan(0.45)
    expect(qtdA / total).toBeLessThan(0.55)
  })

  test('respeita pesos desbalanceados (80/20)', () => {
    const v = [
      { nome: 'A', peso: 80 },
      { nome: 'B', peso: 20 },
    ]
    let qtdA = 0
    const total = 5000
    for (let i = 0; i < total; i++) {
      if (escolherVariante('exp2', `u${i}`, v) === 'A') qtdA++
    }
    expect(qtdA / total).toBeGreaterThan(0.75)
    expect(qtdA / total).toBeLessThan(0.85)
  })

  test('lança erro com lista vazia', () => {
    expect(() => escolherVariante('exp', 'u', [])).toThrow()
  })

  test('peso total zero → cai na primeira variante', () => {
    const v = [
      { nome: 'A', peso: 0 },
      { nome: 'B', peso: 0 },
    ]
    expect(escolherVariante('exp', 'u', v)).toBe('A')
  })
})

describe('variantesValidas', () => {
  test('aceita formato correto', () => {
    expect(
      variantesValidas([
        { nome: 'A', peso: 50 },
        { nome: 'B', peso: 50 },
      ]),
    ).toBe(true)
  })

  test('rejeita array vazio', () => {
    expect(variantesValidas([])).toBe(false)
  })

  test('rejeita pesos negativos', () => {
    expect(variantesValidas([{ nome: 'A', peso: -1 }])).toBe(false)
  })

  test('rejeita formato inválido', () => {
    expect(variantesValidas('foo')).toBe(false)
    expect(variantesValidas(null)).toBe(false)
    expect(variantesValidas([{ nome: 'A' }])).toBe(false)
  })
})

describe('calcularResultados', () => {
  test('calcula taxa de conversão por variante', () => {
    const atribuicoes = [
      { variante: 'A', userId: 'u1' },
      { variante: 'A', userId: 'u2' },
      { variante: 'A', userId: 'u3' },
      { variante: 'B', userId: 'u4' },
      { variante: 'B', userId: 'u5' },
    ]
    const eventos = [
      { variante: 'A', userId: 'u1', evento: 'conversao' },
      { variante: 'A', userId: 'u1', evento: 'conversao' }, // duplicado, conta uma só
      { variante: 'B', userId: 'u4', evento: 'conversao' },
      { variante: 'B', userId: 'u5', evento: 'click' }, // não é conversão
    ]
    const r = calcularResultados(atribuicoes, eventos, 'conversao')
    expect(r.A).toEqual({ visitantes: 3, conversoes: 1, taxaPct: 33.33 })
    expect(r.B).toEqual({ visitantes: 2, conversoes: 1, taxaPct: 50 })
  })

  test('variante sem visitantes não aparece', () => {
    const r = calcularResultados([], [], 'conversao')
    expect(Object.keys(r).length).toBe(0)
  })
})
