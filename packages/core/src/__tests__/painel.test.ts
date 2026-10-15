import { describe, expect, it } from 'vitest'
import {
  chaveDiaBR,
  diasAteProva,
  metaDiariaQuestoes,
  primeirosPassos,
  priorizarEstudo,
  visaoSemanal,
} from '../painel'

// 15/10/2026 é uma quinta-feira. 15h UTC = 12h em Brasília.
const QUINTA = new Date('2026-10-15T15:00:00Z')

describe('chaveDiaBR', () => {
  it('usa o fuso de Brasília (UTC-3)', () => {
    expect(chaveDiaBR(new Date('2026-10-15T02:00:00Z'))).toBe('2026-10-14')
    expect(chaveDiaBR(new Date('2026-10-15T03:00:00Z'))).toBe('2026-10-15')
  })
})

describe('metaDiariaQuestoes', () => {
  it('sem carga horária usa meta padrão', () => {
    expect(metaDiariaQuestoes(null)).toBe(20)
    expect(metaDiariaQuestoes(undefined)).toBe(20)
    expect(metaDiariaQuestoes(0)).toBe(20)
  })

  it('escala com a carga horária semanal', () => {
    expect(metaDiariaQuestoes(14)).toBe(12)
    expect(metaDiariaQuestoes(35)).toBe(30)
    expect(metaDiariaQuestoes(70)).toBeGreaterThan(metaDiariaQuestoes(35))
  })

  it('nunca fica abaixo do mínimo', () => {
    expect(metaDiariaQuestoes(1)).toBe(5)
  })
})

describe('diasAteProva', () => {
  it('retorna null sem data de prova', () => {
    expect(diasAteProva(null, QUINTA)).toBeNull()
  })

  it('conta dias de calendário no fuso de Brasília', () => {
    expect(diasAteProva(new Date('2026-10-25T12:00:00Z'), QUINTA)).toBe(10)
    expect(diasAteProva(new Date('2026-10-15T20:00:00Z'), QUINTA)).toBe(0)
  })

  it('prova já passou → 0', () => {
    expect(diasAteProva(new Date('2026-09-01T12:00:00Z'), QUINTA)).toBe(0)
  })
})

describe('visaoSemanal', () => {
  it('semana vazia: 7 dias de seg a dom, tudo zerado', () => {
    const v = visaoSemanal([], QUINTA, 20)
    expect(v.dias.map((d) => d.rotulo)).toEqual(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'])
    expect(v.inicio).toBe('2026-10-12')
    expect(v.fim).toBe('2026-10-18')
    expect(v.totalSemana).toBe(0)
    expect(v.metaSemana).toBe(140)
    expect(v.pctSemana).toBe(0)
  })

  it('marca hoje e dias futuros', () => {
    const v = visaoSemanal([], QUINTA, 20)
    expect(v.dias.find((d) => d.ehHoje)?.rotulo).toBe('Qui')
    expect(v.dias.filter((d) => d.futuro).map((d) => d.rotulo)).toEqual(['Sex', 'Sáb', 'Dom'])
  })

  it('agrega respostas por dia e calcula % da meta (limitado a 100)', () => {
    const respostas = [
      { createdAt: new Date('2026-10-12T13:00:00Z'), correta: true },
      { createdAt: new Date('2026-10-12T14:00:00Z'), correta: false },
      ...Array.from({ length: 30 }, () => ({
        createdAt: new Date('2026-10-14T13:00:00Z'),
        correta: true,
      })),
      // semana anterior — ignorada
      { createdAt: new Date('2026-10-10T13:00:00Z'), correta: true },
    ]
    const v = visaoSemanal(respostas, QUINTA, 20)
    const seg = v.dias[0]!
    const qua = v.dias[2]!
    expect(seg.total).toBe(2)
    expect(seg.acertos).toBe(1)
    expect(seg.pctMeta).toBe(10)
    expect(qua.pctMeta).toBe(100)
    expect(v.totalSemana).toBe(32)
    expect(v.pctSemana).toBe(23)
  })
})

describe('priorizarEstudo', () => {
  it('área fraca e muito cobrada vem primeiro', () => {
    const res = priorizarEstudo([
      { id: 'cm', nome: 'Clínica', total: 20, acertos: 8, incidencia: 30 },
      { id: 'ped', nome: 'Pediatria', total: 20, acertos: 8, incidencia: 10 },
      { id: 'go', nome: 'GO', total: 20, acertos: 18, incidencia: 30 },
    ])
    expect(res.map((r) => r.id)).toEqual(['cm', 'ped', 'go'])
    expect(res[0]!.taxa).toBeCloseTo(0.4)
  })

  it('área nunca treinada entra com lacuna estimada e flag de amostra', () => {
    const res = priorizarEstudo([
      { id: 'prev', nome: 'Preventiva', total: 0, acertos: 0, incidencia: 20 },
      { id: 'cir', nome: 'Cirurgia', total: 20, acertos: 18, incidencia: 20 },
    ])
    expect(res[0]!.id).toBe('prev')
    expect(res[0]!.taxa).toBeNull()
    expect(res[0]!.amostraSuficiente).toBe(false)
  })

  it('sem dados de incidência trata todas com o mesmo peso', () => {
    const res = priorizarEstudo([
      { id: 'a', nome: 'A', total: 10, acertos: 9, incidencia: 0 },
      { id: 'b', nome: 'B', total: 10, acertos: 3, incidencia: 0 },
    ])
    expect(res.map((r) => r.id)).toEqual(['b', 'a'])
    expect(res.every((r) => r.pesoRelativo === 1)).toBe(true)
  })

  it('lista vazia → vazia', () => {
    expect(priorizarEstudo([])).toEqual([])
  })
})

describe('primeirosPassos', () => {
  it('usuário novo: nada feito, primeiro pendente é o onboarding', () => {
    const passos = primeirosPassos({
      onboardingCompleto: false,
      totalRespostas: 0,
      totalRevisoes: 0,
      temPlano: false,
      totalSimulados: 0,
    })
    expect(passos.every((p) => !p.feito)).toBe(true)
    expect(passos[0]!.id).toBe('onboarding')
  })

  it('marca passos concluídos', () => {
    const passos = primeirosPassos({
      onboardingCompleto: true,
      totalRespostas: 12,
      totalRevisoes: 1,
      temPlano: true,
      totalSimulados: 0,
    })
    expect(passos.filter((p) => p.feito).map((p) => p.id)).toEqual([
      'onboarding',
      'plano',
      'questoes',
      'revisao',
    ])
  })
})
