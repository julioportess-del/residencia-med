import { describe, expect, it } from 'vitest'
import { chaveCacheLLM } from '../cache'

const base = { funcao: 'explicarErro', modelo: 'm', versaoPrompt: 'v1' }

describe('chaveCacheLLM', () => {
  it('inputs diferentes geram chaves diferentes', () => {
    const a = chaveCacheLLM({ ...base, args: { questaoId: 'q1' } })
    const b = chaveCacheLLM({ ...base, args: { questaoId: 'q2' } })
    expect(a).not.toBe(b)
  })

  it('objetos aninhados profundos entram na chave', () => {
    const a = chaveCacheLLM({ ...base, args: { q: { alternativas: [{ letra: 'A' }] } } })
    const b = chaveCacheLLM({ ...base, args: { q: { alternativas: [{ letra: 'B' }] } } })
    expect(a).not.toBe(b)
  })

  it('ordem das chaves não altera a chave', () => {
    const a = chaveCacheLLM({ ...base, args: { x: 1, y: { b: 2, a: 1 } } })
    const b = chaveCacheLLM({
      args: { y: { a: 1, b: 2 }, x: 1 },
      versaoPrompt: 'v1',
      modelo: 'm',
      funcao: 'explicarErro',
    })
    expect(a).toBe(b)
  })

  it('modelo e versão do prompt entram na chave', () => {
    const a = chaveCacheLLM({ ...base, args: { q: 1 } })
    const b = chaveCacheLLM({ ...base, versaoPrompt: 'v2', args: { q: 1 } })
    expect(a).not.toBe(b)
  })
})
