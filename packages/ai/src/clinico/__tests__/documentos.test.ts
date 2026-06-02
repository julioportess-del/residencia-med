import { describe, it, expect } from 'vitest'
import { estruturaClinicaSchema, type EstruturaClinica } from '../tipos'
import {
  documentosDisponiveis,
  renderizarDocumento,
  renderizarAtestado,
  renderizarReceita,
  renderizarSolicitacaoExames,
  renderizarEncaminhamento,
} from '../documentos'

// Base valida com defaults do schema; cada teste sobrescreve o que precisa.
function estrutura(parcial: Partial<EstruturaClinica> = {}): EstruturaClinica {
  const base = estruturaClinicaSchema.parse({})
  return {
    ...base,
    ...parcial,
    subjetivo: { ...base.subjetivo, ...parcial.subjetivo },
    objetivo: { ...base.objetivo, ...parcial.objetivo },
    avaliacao: { ...base.avaliacao, ...parcial.avaliacao },
    plano: { ...base.plano, ...parcial.plano },
  }
}

const ctx = { pacienteIniciais: 'J.P.', data: new Date('2026-06-01T12:00:00Z') }

describe('documentosDisponiveis', () => {
  it('sempre oferece atestado, resumo e orientações', () => {
    expect(documentosDisponiveis(estrutura())).toEqual([
      'ATESTADO',
      'RESUMO_CONSULTA',
      'ORIENTACOES_PACIENTE',
    ])
  })

  it('inclui RECEITA quando há prescrições', () => {
    const e = estrutura({ plano: { prescricoes: ['Amoxicilina 500mg VO 8/8h por 7 dias'] } as never })
    expect(documentosDisponiveis(e)).toContain('RECEITA')
  })

  it('inclui SOLICITACAO_EXAMES quando há exames solicitados', () => {
    const e = estrutura({ plano: { examesSolicitados: ['Hemograma'] } as never })
    expect(documentosDisponiveis(e)).toContain('SOLICITACAO_EXAMES')
  })

  it('inclui ENCAMINHAMENTO quando há CID sugerido mesmo sem encaminhamento explícito', () => {
    const e = estrutura({
      avaliacao: { cidSugerido: [{ codigo: 'I10', descricao: 'Hipertensão essencial' }] } as never,
    })
    expect(documentosDisponiveis(e)).toContain('ENCAMINHAMENTO')
  })
})

describe('renderizarAtestado', () => {
  it('inclui afastamento quando dias > 0', () => {
    const texto = renderizarAtestado(estrutura(), ctx, { dias: 3 })
    expect(texto).toContain('3 dia(s)')
    expect(texto).toContain('J.P.')
    expect(texto).toContain('01/06/2026')
  })

  it('omite afastamento quando dias ausente', () => {
    const texto = renderizarAtestado(estrutura(), ctx, {})
    expect(texto).not.toContain('afastamento')
  })

  it('inclui CID apenas quando incluirCid e há CID', () => {
    const e = estrutura({
      avaliacao: { cidSugerido: [{ codigo: 'J06', descricao: 'IVAS' }] } as never,
    })
    expect(renderizarAtestado(e, ctx, { incluirCid: true })).toContain('J06')
    expect(renderizarAtestado(e, ctx, { incluirCid: false })).not.toContain('J06')
  })
})

describe('renderizações de listas', () => {
  it('numera prescrições no receituário', () => {
    const e = estrutura({ plano: { prescricoes: ['Dipirona 1g', 'Omeprazol 20mg'] } as never })
    const texto = renderizarReceita(e, ctx)
    expect(texto).toContain('1. Dipirona 1g')
    expect(texto).toContain('2. Omeprazol 20mg')
  })

  it('mostra aviso quando não há exames', () => {
    expect(renderizarSolicitacaoExames(estrutura(), ctx)).toContain('Nenhum exame')
  })

  it('encaminhamento traz CID sugerido com aviso de revisão', () => {
    const e = estrutura({
      plano: { encaminhamentos: ['Cardiologia'] } as never,
      avaliacao: { cidSugerido: [{ codigo: 'I10', descricao: 'HAS' }] } as never,
    })
    const texto = renderizarEncaminhamento(e, ctx)
    expect(texto).toContain('Cardiologia')
    expect(texto).toContain('I10')
  })
})

describe('renderizarDocumento (dispatcher)', () => {
  it('despacha cada tipo sem lançar', () => {
    const e = estrutura({ plano: { prescricoes: ['X'], examesSolicitados: ['Y'] } as never })
    const tipos = [
      'ATESTADO',
      'RECEITA',
      'SOLICITACAO_EXAMES',
      'ENCAMINHAMENTO',
      'ORIENTACOES_PACIENTE',
      'RESUMO_CONSULTA',
    ] as const
    for (const tipo of tipos) {
      expect(renderizarDocumento(tipo, e, ctx)).toBeTruthy()
    }
  })
})
