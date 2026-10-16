import { describe, expect, it } from 'vitest'
import {
  decidirClassificacao,
  indexarTaxonomia,
  linhasParaSql,
  normalizarCodigoTema,
  resumirClassificacoes,
  type TemaTaxonomia,
} from '../classificacao-tema'

const TEMAS: TemaTaxonomia[] = [
  { id: 't-fa', codigo: 'CARDIO_ARRITMIAS_FA', nome: 'Fibrilação Atrial', especialidade: 'CARDIO' },
  { id: 't-ic', codigo: 'CARDIO_IC', nome: 'Insuficiência Cardíaca', especialidade: 'CARDIO' },
  { id: 't-neo', codigo: 'PEDIA_NEO', nome: 'Neonatologia', especialidade: 'PEDIA' },
  { id: 't-pn', codigo: 'GO_PRENATAL', nome: 'Pré-Natal', especialidade: 'GO' },
]
const TAXONOMIA = indexarTaxonomia(TEMAS)

describe('normalizarCodigoTema', () => {
  it('ignora caixa, espaços, hífens e acentos', () => {
    expect(normalizarCodigoTema(' cardio_ic ')).toBe('CARDIO_IC')
    expect(normalizarCodigoTema('GO-PRÉNATAL')).toBe('GO_PRENATAL')
    expect(normalizarCodigoTema('pedia neo')).toBe('PEDIA_NEO')
  })
})

describe('decidirClassificacao', () => {
  it('aceita código válido com confiança suficiente e gera linha primária peso 1', () => {
    const d = decidirClassificacao('q1', { codigoTema: 'CARDIO_IC', confianca: 0.9 }, TAXONOMIA)
    expect(d.aceita).toBe(true)
    if (!d.aceita) return
    expect(d.temaPrimario.especialidade).toBe('CARDIO')
    expect(d.linhas).toEqual([{ questaoId: 'q1', temaId: 't-ic', peso: 1, primario: true }])
  })

  it('aceita código com caixa/espaço diferente', () => {
    const d = decidirClassificacao('q1', { codigoTema: ' pedia_neo', confianca: 0.8 }, TAXONOMIA)
    expect(d.aceita && d.temaPrimario.id).toBe('t-neo')
  })

  it('rejeita quando a IA diz que nenhum tema serve', () => {
    const d = decidirClassificacao('q1', { codigoTema: null, confianca: 0.9 }, TAXONOMIA)
    expect(d).toMatchObject({ aceita: false, motivo: 'SEM_TEMA_ADEQUADO' })
    const vazio = decidirClassificacao('q1', { codigoTema: '  ', confianca: 0.9 }, TAXONOMIA)
    expect(vazio).toMatchObject({ aceita: false, motivo: 'SEM_TEMA_ADEQUADO' })
  })

  it('rejeita código inventado que não existe na taxonomia', () => {
    const d = decidirClassificacao('q1', { codigoTema: 'NEURO_AVC', confianca: 0.95 }, TAXONOMIA)
    expect(d).toMatchObject({ aceita: false, motivo: 'CODIGO_INVALIDO', codigoSugerido: 'NEURO_AVC' })
  })

  it('rejeita confiança abaixo do limiar (padrão e customizado)', () => {
    expect(
      decidirClassificacao('q1', { codigoTema: 'CARDIO_IC', confianca: 0.5 }, TAXONOMIA),
    ).toMatchObject({ aceita: false, motivo: 'CONFIANCA_BAIXA' })
    expect(
      decidirClassificacao('q1', { codigoTema: 'CARDIO_IC', confianca: 0.5 }, TAXONOMIA, 0.4)
        .aceita,
    ).toBe(true)
  })

  it('trata confiança fora de [0,1] ou NaN', () => {
    const alta = decidirClassificacao('q1', { codigoTema: 'CARDIO_IC', confianca: 7 }, TAXONOMIA)
    expect(alta.confianca).toBe(1)
    const nan = decidirClassificacao('q1', { codigoTema: 'CARDIO_IC', confianca: NaN }, TAXONOMIA)
    expect(nan).toMatchObject({ aceita: false, motivo: 'CONFIANCA_BAIXA', confianca: 0 })
  })

  it('secundários: valida, remove duplicados e o próprio primário, limita a 2', () => {
    const d = decidirClassificacao(
      'q1',
      {
        codigoTema: 'CARDIO_IC',
        confianca: 0.9,
        secundarios: ['cardio_ic', 'CARDIO_ARRITMIAS_FA', 'INEXISTENTE', 'cardio_arritmias_fa', 'GO_PRENATAL', 'PEDIA_NEO'],
      },
      TAXONOMIA,
    )
    expect(d.aceita).toBe(true)
    if (!d.aceita) return
    expect(d.linhas).toEqual([
      { questaoId: 'q1', temaId: 't-ic', peso: 1, primario: true },
      { questaoId: 'q1', temaId: 't-fa', peso: 0.4, primario: false },
      { questaoId: 'q1', temaId: 't-pn', peso: 0.4, primario: false },
    ])
    expect(d.linhas.filter((l) => l.primario)).toHaveLength(1)
  })
})

describe('resumirClassificacoes', () => {
  it('conta aceitas por especialidade e rejeitadas por motivo', () => {
    const decisoes = [
      decidirClassificacao('a', { codigoTema: 'CARDIO_IC', confianca: 0.9 }, TAXONOMIA),
      decidirClassificacao('b', { codigoTema: 'CARDIO_ARRITMIAS_FA', confianca: 0.9 }, TAXONOMIA),
      decidirClassificacao('c', { codigoTema: 'GO_PRENATAL', confianca: 0.9 }, TAXONOMIA),
      decidirClassificacao('d', { codigoTema: null, confianca: 0.9 }, TAXONOMIA),
      decidirClassificacao('e', { codigoTema: 'X', confianca: 0.9 }, TAXONOMIA),
      decidirClassificacao('f', { codigoTema: 'GO_PRENATAL', confianca: 0.1 }, TAXONOMIA),
    ]
    expect(resumirClassificacoes(decisoes)).toEqual({
      total: 6,
      aceitas: 3,
      rejeitadas: { SEM_TEMA_ADEQUADO: 1, CODIGO_INVALIDO: 1, CONFIANCA_BAIXA: 1 },
      porEspecialidade: { CARDIO: 2, GO: 1 },
    })
  })
})

describe('linhasParaSql', () => {
  it('gera INSERT idempotente com aspas escapadas', () => {
    const sql = linhasParaSql([
      { questaoId: "q'1", temaId: 't-ic', peso: 1, primario: true },
      { questaoId: "q'1", temaId: 't-fa', peso: 0.4, primario: false },
    ])
    expect(sql).toContain(`('q''1', 't-ic', 1, true)`)
    expect(sql).toContain(`('q''1', 't-fa', 0.4, false)`)
    expect(sql).toContain('ON CONFLICT ("questaoId", "temaId") DO NOTHING')
  })

  it('lista vazia não gera SQL', () => {
    expect(linhasParaSql([])).toBe('')
  })
})
