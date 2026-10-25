import { describe, expect, it } from 'vitest'
import {
  calcularCinturao,
  calcularXp,
  FAIXAS_CINTURAO,
  progressoCinturao,
  requisitosFaltantes,
  type EstatisticasUsuario,
  type RequisitosCinturao,
} from '../gamificacao'

const STATS_ZERO: EstatisticasUsuario = {
  respostas: 0,
  revisoes: 0,
  flashcards: 0,
  simuladosFinalizados: 0,
}

describe('calcularXp', () => {
  it('soma ponderada: 10 respostas (50) + 20 revisoes (40) + 5 flashcards (5) + 2 simulados (100) = 195', () => {
    expect(
      calcularXp({ respostas: 10, revisoes: 20, flashcards: 5, simuladosFinalizados: 2 }),
    ).toBe(50 + 40 + 5 + 100)
  })

  it('zero em tudo retorna 0', () => {
    expect(calcularXp(STATS_ZERO)).toBe(0)
  })
})

describe('calcularCinturao sem stats (compat legada)', () => {
  it('xp 0 -> BRONZE', () => expect(calcularCinturao(0)).toBe('BRONZE'))
  it('xp 400 -> BRONZE (não atinge PRATA)', () => expect(calcularCinturao(400)).toBe('BRONZE'))
  it('xp 500 -> PRATA', () => expect(calcularCinturao(500)).toBe('PRATA'))
  it('xp 2000 -> OURO', () => expect(calcularCinturao(2000)).toBe('OURO'))
  it('xp 20000 -> DIAMANTE', () => expect(calcularCinturao(20_000)).toBe('DIAMANTE'))
  it('xp absurdo não ultrapassa DIAMANTE', () =>
    expect(calcularCinturao(999_999)).toBe('DIAMANTE'))
})

describe('calcularCinturao com stats (requisitos compostos)', () => {
  it('xp suficiente mas sem dias ativos — fica preso em BRONZE', () => {
    const stats: EstatisticasUsuario = {
      ...STATS_ZERO,
      respostas: 500,
      diasAtivos: 2, // menos que 7 exigidos pra PRATA
      taxaAcerto: 0.8,
    }
    expect(calcularCinturao(2000, stats)).toBe('BRONZE')
  })

  it('xp suficiente e dias ativos ok mas poucas respostas — fica em BRONZE', () => {
    const stats: EstatisticasUsuario = {
      ...STATS_ZERO,
      respostas: 50, // menos que 100 exigidos
      diasAtivos: 10,
    }
    expect(calcularCinturao(500, stats)).toBe('BRONZE')
  })

  it('todos requisitos de PRATA cumpridos → PRATA', () => {
    const stats: EstatisticasUsuario = {
      ...STATS_ZERO,
      respostas: 100,
      diasAtivos: 7,
    }
    expect(calcularCinturao(500, stats)).toBe('PRATA')
  })

  it('OURO exige taxa de acerto mínima 0.5 — reprovado com 0.4', () => {
    const stats: EstatisticasUsuario = {
      ...STATS_ZERO,
      respostas: 400,
      diasAtivos: 21,
      taxaAcerto: 0.4,
    }
    expect(calcularCinturao(2000, stats)).toBe('PRATA')
  })

  it('OURO aprovado com acerto 0.5 cravado', () => {
    const stats: EstatisticasUsuario = {
      ...STATS_ZERO,
      respostas: 400,
      diasAtivos: 21,
      taxaAcerto: 0.5,
    }
    expect(calcularCinturao(2000, stats)).toBe('OURO')
  })

  it('ESMERALDA exige 3 simulados — reprovado com 0', () => {
    const stats: EstatisticasUsuario = {
      ...STATS_ZERO,
      respostas: 1000,
      diasAtivos: 45,
      taxaAcerto: 0.6,
      simuladosFinalizados: 0,
    }
    expect(calcularCinturao(5000, stats)).toBe('OURO')
  })

  it('DIAMANTE: todos requisitos cravados', () => {
    const stats: EstatisticasUsuario = {
      respostas: 5000,
      revisoes: 0,
      flashcards: 0,
      simuladosFinalizados: 20,
      diasAtivos: 150,
      taxaAcerto: 0.7,
    }
    expect(calcularCinturao(20_000, stats)).toBe('DIAMANTE')
  })
})

describe('requisitosFaltantes', () => {
  const req: RequisitosCinturao = {
    xpMin: 1000,
    diasAtivosMin: 10,
    respostasMin: 200,
    taxaAcertoMin: 0.6,
    simuladosFinalizadosMin: 2,
  }

  it('tudo zerado lista todas as 5 falhas', () => {
    const faltas = requisitosFaltantes(0, STATS_ZERO, req)
    expect(faltas).toHaveLength(5)
    expect(faltas.map((f) => f.chave).sort()).toEqual([
      'diasAtivos',
      'respostas',
      'simuladosFinalizados',
      'taxaAcerto',
      'xp',
    ])
  })

  it('tudo satisfeito retorna lista vazia', () => {
    const stats: EstatisticasUsuario = {
      respostas: 200,
      revisoes: 0,
      flashcards: 0,
      simuladosFinalizados: 2,
      diasAtivos: 10,
      taxaAcerto: 0.6,
    }
    expect(requisitosFaltantes(1000, stats, req)).toHaveLength(0)
  })

  it('taxaAcerto é reportada como percentual inteiro', () => {
    const stats: EstatisticasUsuario = {
      ...STATS_ZERO,
      respostas: 200,
      diasAtivos: 10,
      simuladosFinalizados: 2,
      taxaAcerto: 0.42,
    }
    const faltas = requisitosFaltantes(1000, stats, req)
    const taxa = faltas.find((f) => f.chave === 'taxaAcerto')
    expect(taxa).toBeDefined()
    expect(taxa?.atual).toBe(42)
    expect(taxa?.necessario).toBe(60)
  })

  it('requisito opcional ausente no req não bloqueia', () => {
    const soXp: RequisitosCinturao = { xpMin: 100 }
    expect(requisitosFaltantes(100, STATS_ZERO, soXp)).toHaveLength(0)
  })

  it('stats sem campo opcional é tratado como 0', () => {
    const stats: EstatisticasUsuario = {
      ...STATS_ZERO,
      respostas: 200,
      simuladosFinalizados: 2,
      // sem diasAtivos nem taxaAcerto
    }
    const faltas = requisitosFaltantes(1000, stats, req)
    expect(faltas.map((f) => f.chave).sort()).toEqual(['diasAtivos', 'taxaAcerto'])
  })
})

describe('progressoCinturao', () => {
  it('BRONZE recém-começou — 0% com stats zerado', () => {
    const p = progressoCinturao(0, STATS_ZERO)
    expect(p.cinturao).toBe('BRONZE')
    expect(p.progressoPct).toBe(0)
    expect(p.proximoCinturao).toBe('PRATA')
    expect(p.xpProximaFaixa).toBe(500)
    expect(p.requisitosFaltantes.length).toBeGreaterThan(0)
  })

  it('DIAMANTE: progressoPct 100 e sem próximo', () => {
    const stats: EstatisticasUsuario = {
      respostas: 5000,
      revisoes: 0,
      flashcards: 0,
      simuladosFinalizados: 20,
      diasAtivos: 150,
      taxaAcerto: 0.7,
    }
    const p = progressoCinturao(20_000, stats)
    expect(p.cinturao).toBe('DIAMANTE')
    expect(p.progressoPct).toBe(100)
    expect(p.proximoCinturao).toBeNull()
    expect(p.xpProximaFaixa).toBeNull()
    expect(p.requisitosFaltantes).toHaveLength(0)
  })

  it('xp entre faixas: progresso proporcional dentro da faixa atual', () => {
    const stats: EstatisticasUsuario = {
      respostas: 100,
      revisoes: 0,
      flashcards: 0,
      simuladosFinalizados: 0,
      diasAtivos: 7,
    }
    // Está em PRATA (xpMin 500) com xp=1250, próxima faixa é OURO (xpMin 2000).
    // Pct dentro da faixa: (1250-500) / (2000-500) = 50%
    const p = progressoCinturao(1250, stats)
    expect(p.cinturao).toBe('PRATA')
    expect(p.progressoPct).toBe(50)
    expect(p.xpInicioFaixa).toBe(500)
    expect(p.xpProximaFaixa).toBe(2000)
  })
})

describe('FAIXAS_CINTURAO', () => {
  it('contém as 6 faixas canônicas em ordem crescente de xpMin', () => {
    const nomes = FAIXAS_CINTURAO.map((f) => f.cinturao)
    expect(nomes).toEqual(['BRONZE', 'PRATA', 'OURO', 'ESMERALDA', 'PLATINA', 'DIAMANTE'])
    const xps = FAIXAS_CINTURAO.map((f) => f.requisitos.xpMin)
    const ordenados = [...xps].sort((a, b) => a - b)
    expect(xps).toEqual(ordenados)
  })
})
