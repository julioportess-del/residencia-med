import { describe, expect, it } from 'vitest'
import { extrairComentario, montarRequisicaoComentario } from '../comentar-questao'

const valido = {
  gabaritoConcorda: true,
  divergencia: null,
  dependeImagem: false,
  resumo: 'Resumo objetivo.',
  conceitoPrincipal: 'Conceito.',
  pegadinha: null,
  alternativas: [
    { letra: 'A', comentario: 'Correta porque X.' },
    { letra: 'B', comentario: 'Errada porque Y.' },
  ],
  referencia: null,
  assuntosRelacionados: ['Tema 1'],
  flashcard: { frente: 'Pergunta?', verso: 'Resposta.' },
}

describe('extrairComentario', () => {
  it('aceita JSON válido (inclusive cercado por ```json)', () => {
    const r = extrairComentario('```json\n' + JSON.stringify(valido) + '\n```', ['A', 'B'])
    expect(r.resumo).toBe('Resumo objetivo.')
  })

  it('rejeita quando falta comentário de alguma alternativa', () => {
    expect(() => extrairComentario(JSON.stringify(valido), ['A', 'B', 'C'])).toThrow(/C/)
  })

  it('rejeita texto sem JSON', () => {
    expect(() => extrairComentario('não consigo', ['A'])).toThrow()
  })

  it('rejeita comentário vazio', () => {
    const ruim = {
      ...valido,
      alternativas: [{ letra: 'A', comentario: '' }, valido.alternativas[1]],
    }
    expect(() => extrairComentario(JSON.stringify(ruim), ['A', 'B'])).toThrow()
  })
})

describe('montarRequisicaoComentario', () => {
  it('monta requisição de lote com custom_id e modelo', () => {
    const r = montarRequisicaoComentario('ckq123', {
      banca: 'AMRIGS',
      ano: 2024,
      enunciado: 'Enunciado',
      alternativas: [{ letra: 'A', texto: 'x' }],
      gabaritoLetra: 'A',
    })
    expect(r.custom_id).toBe('comentar-ckq123')
    expect(r.params.model).toBe('claude-opus-5-5')
    expect(r.params.messages[0]?.content).toContain('Gabarito oficial: A')
  })
})

describe('requisições de lote para modelos 5.5', () => {
  it('não enviam temperature (rejeitado pelos modelos novos)', () => {
    const r = montarRequisicaoComentario('q1', {
      banca: 'X',
      ano: 2024,
      enunciado: 'E',
      alternativas: [{ letra: 'A', texto: 'a' }],
      gabaritoLetra: 'A',
    })
    expect('temperature' in r.params).toBe(false)
  })
})
