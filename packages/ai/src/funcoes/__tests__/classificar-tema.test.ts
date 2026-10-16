import { describe, expect, it } from 'vitest'
import { extrairJsonClassificacao } from '../classificar-tema'
import { promptClassificarTema } from '../../prompts/classificar-tema'

describe('extrairJsonClassificacao', () => {
  it('lê JSON puro', () => {
    expect(
      extrairJsonClassificacao(
        '{"codigoTema":"CARDIO_IC","secundarios":[],"confianca":0.9,"justificativa":"x"}',
      ),
    ).toEqual({ codigoTema: 'CARDIO_IC', secundarios: [], confianca: 0.9, justificativa: 'x' })
  })

  it('lê JSON dentro de cerca e com texto em volta; aplica defaults', () => {
    const r = extrairJsonClassificacao(
      'Segue:\n```json\n{"codigoTema": null, "confianca": 0.8}\n```\nfim',
    )
    expect(r).toEqual({ codigoTema: null, secundarios: [], confianca: 0.8, justificativa: '' })
  })

  it('falha sem JSON ou com formato errado', () => {
    expect(() => extrairJsonClassificacao('não sei')).toThrow()
    expect(() => extrairJsonClassificacao('{"codigoTema": 3, "confianca": 1}')).toThrow()
  })
})

describe('promptClassificarTema', () => {
  it('inclui taxonomia, caso clínico e alternativas', () => {
    const { user } = promptClassificarTema({
      enunciado: 'Qual a conduta?',
      vignette: 'Paciente de 70 anos com dispneia.',
      alternativas: [{ letra: 'A', texto: 'Furosemida' }],
      temasDisponiveis: [
        { codigo: 'CARDIO_IC', nome: 'Insuficiência Cardíaca', especialidade: 'CARDIO' },
      ],
    })
    expect(user).toContain('CARDIO_IC (CARDIO): Insuficiência Cardíaca')
    expect(user).toContain('Paciente de 70 anos')
    expect(user).toContain('A) Furosemida')
  })
})
