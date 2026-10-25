import { describe, expect, it } from 'vitest'
import {
  calcularPerfilLape,
  classificarMemoria,
  classificarProcrastinacao,
  ITENS_DISC,
  ITENS_MEMORIA,
  ITENS_PROCRASTINACAO,
  ITENS_SOCIO,
  type RespostasLape,
  type ValorLikert,
} from '../perfil-lape'

/** Helper: resposta uniforme pra todos os itens listados. */
function responderTodos(valor: ValorLikert): RespostasLape {
  const r: RespostasLape = {}
  for (const i of [...ITENS_DISC, ...ITENS_SOCIO, ...ITENS_PROCRASTINACAO, ...ITENS_MEMORIA]) {
    r[i.id] = valor
  }
  return r
}

describe('classificarProcrastinacao', () => {
  it('score 5-12 = LEVE', () => {
    expect(classificarProcrastinacao(5)).toBe('LEVE')
    expect(classificarProcrastinacao(12)).toBe('LEVE')
  })
  it('score 13-18 = MODERADA', () => {
    expect(classificarProcrastinacao(13)).toBe('MODERADA')
    expect(classificarProcrastinacao(18)).toBe('MODERADA')
  })
  it('score 19-25 = SEVERA', () => {
    expect(classificarProcrastinacao(19)).toBe('SEVERA')
    expect(classificarProcrastinacao(25)).toBe('SEVERA')
  })
})

describe('classificarMemoria', () => {
  it('cada faixa cobre o limite declarado', () => {
    expect(classificarMemoria(4)).toBe('BAIXA')
    expect(classificarMemoria(8)).toBe('BAIXA')
    expect(classificarMemoria(9)).toBe('MEDIA')
    expect(classificarMemoria(12)).toBe('MEDIA')
    expect(classificarMemoria(13)).toBe('ACIMA_DA_MEDIA')
    expect(classificarMemoria(16)).toBe('ACIMA_DA_MEDIA')
    expect(classificarMemoria(17)).toBe('ALTA')
    expect(classificarMemoria(20)).toBe('ALTA')
  })
})

describe('calcularPerfilLape', () => {
  it('sem nenhuma resposta → tudo null e completo=false', () => {
    const r = calcularPerfilLape({})
    expect(r.disc).toBeNull()
    expect(r.socioemocional).toBeNull()
    expect(r.procrastinacao).toBeNull()
    expect(r.memoria).toBeNull()
    expect(r.completo).toBe(false)
  })

  it('tudo neutro (3) → classifica cada dimensão mas scores empatados', () => {
    const r = calcularPerfilLape(responderTodos(3))
    expect(r.completo).toBe(true)
    // Com todos itens em 3: procrastinacao total = 4 itens positivos (3) + 1 invertido (6-3=3) = 15 → MODERADA
    expect(r.procrastinacao).toBe('MODERADA')
    // Memória: 3 itens em 3 + 1 invertido (3) = 12 → MEDIA
    expect(r.memoria).toBe('MEDIA')
    // Discriminação por dimensão: todos 3 → empate 9/9/9/9. argmax dá o primeiro.
    expect(r.scores.disc.ANALISTA).toBe(9)
    expect(r.scores.disc.COMUNICADOR).toBe(9)
    expect(r.scores.disc.EXECUTOR).toBe(9)
    expect(r.scores.disc.CONCILIADOR).toBe(9)
  })

  it('pontuação alta em todos os itens EXECUTOR → disc=EXECUTOR', () => {
    const r: RespostasLape = {}
    for (const i of ITENS_DISC) {
      r[i.id] = i.dimensao === 'EXECUTOR' ? 5 : 1
    }
    for (const i of ITENS_SOCIO) r[i.id] = 3
    for (const i of ITENS_PROCRASTINACAO) r[i.id] = 3
    for (const i of ITENS_MEMORIA) r[i.id] = 3
    const resultado = calcularPerfilLape(r)
    expect(resultado.disc).toBe('EXECUTOR')
    expect(resultado.scores.disc.EXECUTOR).toBe(15)
    expect(resultado.scores.disc.ANALISTA).toBe(3)
  })

  it('pontuação alta em todos os itens PESSOAS → socio=PESSOAS', () => {
    const r: RespostasLape = {}
    for (const i of ITENS_DISC) r[i.id] = 3
    for (const i of ITENS_SOCIO) r[i.id] = i.dimensao === 'PESSOAS' ? 5 : 1
    for (const i of ITENS_PROCRASTINACAO) r[i.id] = 3
    for (const i of ITENS_MEMORIA) r[i.id] = 3
    const resultado = calcularPerfilLape(r)
    expect(resultado.socioemocional).toBe('PESSOAS')
  })

  it('todas as perguntas de procrastinação em 5 → SEVERA (invertida vira 1)', () => {
    const r: RespostasLape = {}
    for (const i of ITENS_PROCRASTINACAO) r[i.id] = 5
    for (const i of ITENS_DISC) r[i.id] = 3
    for (const i of ITENS_SOCIO) r[i.id] = 3
    for (const i of ITENS_MEMORIA) r[i.id] = 3
    const resultado = calcularPerfilLape(r)
    // 4 positivas (5) + 1 invertida (6-5=1) = 21 → SEVERA
    expect(resultado.scores.procrastinacao).toBe(21)
    expect(resultado.procrastinacao).toBe('SEVERA')
  })

  it('todas as perguntas de procrastinação em 1 → LEVE', () => {
    const r: RespostasLape = {}
    for (const i of ITENS_PROCRASTINACAO) r[i.id] = 1
    for (const i of ITENS_DISC) r[i.id] = 3
    for (const i of ITENS_SOCIO) r[i.id] = 3
    for (const i of ITENS_MEMORIA) r[i.id] = 3
    const resultado = calcularPerfilLape(r)
    // 4 positivas (1) + 1 invertida (6-1=5) = 9 → LEVE
    expect(resultado.scores.procrastinacao).toBe(9)
    expect(resultado.procrastinacao).toBe('LEVE')
  })

  it('memória máxima → ALTA', () => {
    const r: RespostasLape = {}
    for (const i of ITENS_MEMORIA) r[i.id] = 5
    for (const i of ITENS_DISC) r[i.id] = 3
    for (const i of ITENS_SOCIO) r[i.id] = 3
    for (const i of ITENS_PROCRASTINACAO) r[i.id] = 3
    const resultado = calcularPerfilLape(r)
    // 3 positivas (5) + 1 invertida (6-5=1) = 16 → ACIMA_DA_MEDIA (limite ≤16)
    expect(resultado.scores.memoria).toBe(16)
    expect(resultado.memoria).toBe('ACIMA_DA_MEDIA')
  })

  it('dimensão parcialmente respondida fica null (sem classificar com menos itens)', () => {
    const r: RespostasLape = {}
    // Responde só 2 dos 3 itens de ANALISTA, resto fica em branco
    r['d01'] = 5
    r['d02'] = 5
    const resultado = calcularPerfilLape(r)
    expect(resultado.disc).toBeNull()
    expect(resultado.socioemocional).toBeNull()
    expect(resultado.procrastinacao).toBeNull()
    expect(resultado.memoria).toBeNull()
    expect(resultado.completo).toBe(false)
  })

  it('bancos de itens têm os tamanhos esperados', () => {
    expect(ITENS_DISC).toHaveLength(12)
    expect(ITENS_SOCIO).toHaveLength(12)
    expect(ITENS_PROCRASTINACAO).toHaveLength(5)
    expect(ITENS_MEMORIA).toHaveLength(4)
  })

  it('IDs são únicos entre todos os itens', () => {
    const ids = [...ITENS_DISC, ...ITENS_SOCIO, ...ITENS_PROCRASTINACAO, ...ITENS_MEMORIA].map(
      (i) => i.id,
    )
    const unicos = new Set(ids)
    expect(unicos.size).toBe(ids.length)
  })
})
