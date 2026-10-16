import { describe, expect, it } from 'vitest'
import type { ComentarioQuestao } from '@residencia-med/ai'
import { montarSqlGravacao, sqlComentario, sqlTemas } from '../gravar-lote-ia'

const comentario: ComentarioQuestao = {
  gabaritoConcorda: false,
  divergencia: "Literatura diz B (O'Brien)",
  dependeImagem: false,
  resumo: 'Resumo',
  conceitoPrincipal: 'Conceito',
  pegadinha: null,
  alternativas: [{ letra: 'A', comentario: 'x' }],
  referencia: null,
  assuntosRelacionados: [],
  flashcard: { frente: 'f', verso: 'v' },
}

describe('gravar-lote-ia', () => {
  it('marca gabarito contestado sem trocar o gabarito oficial', () => {
    const sql = sqlComentario('q1', comentario)
    expect(sql).toContain('"gabaritoContestadoIa" = true')
    expect(sql).not.toContain('gabaritoLetra')
    expect(sql).toContain("O'Brien")
  })

  it('cria temas só quando o código não existe', () => {
    const sql = sqlTemas([{ codigo: 'X_Y', nome: 'X', especialidade: 'CLINICA', pai: 'X' }])
    expect(sql).toContain('WHERE NOT EXISTS (SELECT 1 FROM "Tema" t WHERE t.codigo = tx.codigo)')
    expect(sql).toContain('"parentId"')
  })

  it('classifica apenas questões sem tema manual e ignora rejeitadas', () => {
    const sql = montarSqlGravacao([
      {
        questao: { id: 'q1' },
        comentario: null,
        classificacao: {
          aceita: true,
          questaoId: 'q1',
          confianca: 0.9,
          temaPrimario: {
            id: 'CARDIO_IC',
            codigo: 'CARDIO_IC',
            nome: 'IC',
            especialidade: 'CARDIO',
          },
          linhas: [{ questaoId: 'q1', temaId: 'CARDIO_IC', peso: 1, primario: true }],
        },
      },
      {
        questao: { id: 'q2' },
        comentario: null,
        classificacao: {
          aceita: false,
          questaoId: 'q2',
          motivo: 'CONFIANCA_BAIXA',
          codigoSugerido: 'X',
          confianca: 0.2,
        },
      },
    ])
    expect(sql.match(/INSERT INTO "QuestaoTema"/g)).toHaveLength(1)
    expect(sql).toContain("qt.origem <> 'IA'")
    expect(sql.startsWith('BEGIN;')).toBe(true)
  })
})
