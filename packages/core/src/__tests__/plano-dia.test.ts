import { describe, expect, it } from 'vitest'
import { MINUTOS_POR_MODO, planejarDia, saudacao } from '../plano-dia'

describe('planejarDia', () => {
  it('modo rápido (10 min) sem pendências: só questões inéditas', () => {
    const p = planejarDia({
      minutos: MINUTOS_POR_MODO.RAPIDO,
      revisoesPendentes: 0,
      errosAbertos: 0,
      ineditasDisponiveis: 500,
    })
    expect(p.tarefas).toEqual([expect.objectContaining({ tipo: 'INEDITAS', quantidade: 3 })])
  })

  it('prioriza revisões vencidas, limitadas a ~40% do tempo', () => {
    const p = planejarDia({
      minutos: 40,
      revisoesPendentes: 100,
      errosAbertos: 0,
      ineditasDisponiveis: 500,
    })
    const rev = p.tarefas.find((t) => t.tipo === 'REVISOES')
    expect(rev?.quantidade).toBe(8) // 16 min / 2 min
    expect(p.tarefas.find((t) => t.tipo === 'INEDITAS')?.quantidade).toBeGreaterThan(0)
  })

  it('poucas revisões: faz todas e redistribui o tempo', () => {
    const p = planejarDia({
      minutos: 40,
      revisoesPendentes: 2,
      errosAbertos: 1,
      ineditasDisponiveis: 500,
    })
    expect(p.tarefas.find((t) => t.tipo === 'REVISOES')?.quantidade).toBe(2)
    expect(p.tarefas.find((t) => t.tipo === 'ERROS')?.quantidade).toBe(1)
    const total = p.tarefas.reduce((s, t) => s + t.minutos, 0)
    expect(total).toBeLessThanOrEqual(40)
    expect(total).toBeGreaterThan(30)
  })

  it('não recomenda mais inéditas do que existem', () => {
    const p = planejarDia({
      minutos: 90,
      revisoesPendentes: 0,
      errosAbertos: 0,
      ineditasDisponiveis: 4,
    })
    expect(p.tarefas.find((t) => t.tipo === 'INEDITAS')?.quantidade).toBe(4)
  })

  it('sem nada disponível → lista vazia', () => {
    expect(
      planejarDia({ minutos: 30, revisoesPendentes: 0, errosAbertos: 0, ineditasDisponiveis: 0 })
        .tarefas,
    ).toEqual([])
  })
})

describe('saudacao', () => {
  it('usa o horário de Brasília', () => {
    expect(saudacao(new Date('2026-10-16T11:00:00Z'))).toBe('Bom dia') // 08h BRT
    expect(saudacao(new Date('2026-10-16T17:00:00Z'))).toBe('Boa tarde') // 14h
    expect(saudacao(new Date('2026-10-16T23:30:00Z'))).toBe('Boa noite') // 20h30
  })
})

describe('planejarDia — flashcards', () => {
  it('flashcards vencidos vêm primeiro (~30 s cada, até 25% do tempo)', () => {
    const p = planejarDia({
      minutos: 40,
      flashcardsVencidos: 100,
      revisoesPendentes: 0,
      errosAbertos: 0,
      ineditasDisponiveis: 500,
    })
    expect(p.tarefas[0]).toMatchObject({ tipo: 'FLASHCARDS', quantidade: 20, minutos: 10 })
  })

  it('sem o campo de flashcards, comportamento anterior', () => {
    const p = planejarDia({
      minutos: 10,
      revisoesPendentes: 0,
      errosAbertos: 0,
      ineditasDisponiveis: 9,
    })
    expect(p.tarefas.some((t) => t.tipo === 'FLASHCARDS')).toBe(false)
  })
})
