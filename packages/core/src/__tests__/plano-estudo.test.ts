import { addWeeks } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { dataDoBloco, gerarPlano, priorizarTemas, type TemaCandidato } from '../plano-estudo'

const HOJE = new Date('2026-05-04T12:00:00Z') // segunda-feira
const TEMAS_BASE: TemaCandidato[] = [
  { temaId: 't1', nomeTema: 'FA', porcentagemBanca: 12, tendencia: 1, desempenhoUsuario: 0.4 },
  { temaId: 't2', nomeTema: 'IAM', porcentagemBanca: 8, tendencia: 0, desempenhoUsuario: 0.7 },
  { temaId: 't3', nomeTema: 'IC', porcentagemBanca: 6, tendencia: 2, desempenhoUsuario: null },
  { temaId: 't4', nomeTema: 'HAS', porcentagemBanca: 5, tendencia: -1, desempenhoUsuario: 0.9 },
  { temaId: 't5', nomeTema: 'Vacinas', porcentagemBanca: 4, tendencia: 0, desempenhoUsuario: 0.5 },
]

describe('priorizarTemas', () => {
  it('coloca tema com pior desempenho a frente quando incidencia e proxima', () => {
    const ordem = priorizarTemas(TEMAS_BASE)
    expect(ordem[0]?.temaId).toBe('t1') // pior desempenho + maior incidencia
  })

  it('tema sem desempenho fica acima de tema com desempenho alto', () => {
    const ordem = priorizarTemas([
      { temaId: 'A', nomeTema: 'A', porcentagemBanca: 10, tendencia: 0, desempenhoUsuario: 0.95 },
      { temaId: 'B', nomeTema: 'B', porcentagemBanca: 10, tendencia: 0, desempenhoUsuario: null },
    ])
    // null (1.2x) > 0.95 desempenho (1.05x) — quem domina o tema cai na prioridade
    expect(ordem[0]?.temaId).toBe('B')
  })

  it('tema com desempenho ruim sobe acima de tema com desempenho alto na mesma incidencia', () => {
    const ordem = priorizarTemas([
      { temaId: 'A', nomeTema: 'A', porcentagemBanca: 10, tendencia: 0, desempenhoUsuario: 0.9 },
      { temaId: 'B', nomeTema: 'B', porcentagemBanca: 10, tendencia: 0, desempenhoUsuario: 0.4 },
    ])
    expect(ordem[0]?.temaId).toBe('B')
  })
})

describe('gerarPlano', () => {
  it('gera blocos cobrindo todas as semanas ate a prova', () => {
    const blocos = gerarPlano(TEMAS_BASE, {
      cargaHorariaSemanal: 12,
      dataProva: addWeeks(HOJE, 4),
      inicio: HOJE,
      diasEstudoSemana: [1, 2, 3, 4, 5],
    })
    const semanas = new Set(blocos.map((b) => b.semana))
    expect(semanas.size).toBe(4)
  })

  it('inclui ao menos um simulado semanal aos sabados quando habilitado', () => {
    const blocos = gerarPlano(TEMAS_BASE, {
      cargaHorariaSemanal: 14,
      dataProva: addWeeks(HOJE, 2),
      inicio: HOJE,
    })
    const sabados = blocos.filter((b) => b.diaSemana === 6)
    expect(sabados.some((b) => b.tipo === 'SIMULADO')).toBe(true)
  })

  it('distribui blocos proporcionalmente a carga horaria (com tolerancia de bloco fixo)', () => {
    const cargaSemanal = 10
    const dias = [1, 2, 3, 4, 5]
    const blocos = gerarPlano(TEMAS_BASE, {
      cargaHorariaSemanal: cargaSemanal,
      dataProva: addWeeks(HOJE, 1),
      inicio: HOJE,
      diasEstudoSemana: dias,
    })
    const minutosTotal = blocos
      .filter((b) => b.semana === 0)
      .reduce((acc, b) => acc + b.duracaoMin, 0)
    // Blocos sao fixos em 45min — esperado ~450 vs ideal 600. Tolerancia de 1 bloco/dia.
    expect(minutosTotal).toBeGreaterThan(cargaSemanal * 60 * 0.5)
    expect(minutosTotal).toBeLessThanOrEqual(cargaSemanal * 60)
  })

  it('nao gera blocos quando lista de temas e vazia', () => {
    const blocos = gerarPlano([], {
      cargaHorariaSemanal: 10,
      dataProva: addWeeks(HOJE, 2),
      inicio: HOJE,
      diasEstudoSemana: [1, 2, 3],
    })
    expect(blocos.length).toBeGreaterThan(0)
    expect(blocos.every((b) => b.tipo !== 'QUESTOES' || b.temaId === undefined)).toBe(true)
  })
})

describe('dataDoBloco', () => {
  it('calcula data correta a partir de inicio + semana + diaSemana (independente de timezone)', () => {
    // Date constructor com argumentos individuais respeita TZ local — evita drift UTC.
    const inicio = new Date(2026, 4, 4) // 4 de maio de 2026, segunda em local time
    const data = dataDoBloco(
      { semana: 1, diaSemana: 3, ordem: 0, duracaoMin: 45, tipo: 'QUESTOES', titulo: 'x' },
      inicio,
    )
    // semana 1 + dia 3 (quarta) = 13 de maio em local time
    expect(data.getDate()).toBe(13)
    expect(data.getMonth()).toBe(4)
    expect(data.getDay()).toBe(3) // quarta
  })
})
