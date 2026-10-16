import { describe, expect, it } from 'vitest'
import { detectarPadroesErro, montarCadernoErros, type EntradaCaderno } from '../caderno-erros'

const resp = (questaoId: string, correta: boolean, dia: number) => ({
  questaoId,
  correta,
  confianca: 'INCERTO' as const,
  createdAt: new Date(Date.UTC(2026, 9, dia)),
})
const meta = (tema: string | null, area: string | null = 'Clínica Médica') => ({ tema, area })

describe('montarCadernoErros', () => {
  it('inclui só questões já erradas, com status pela última tentativa', () => {
    const caderno = montarCadernoErros({
      respostas: [resp('a', false, 1), resp('b', true, 1), resp('c', false, 1), resp('c', true, 3)],
      registros: [],
      metadados: new Map([
        ['a', meta('Gasometria')],
        ['c', meta('Gasometria')],
      ]),
      proximasRevisoes: new Map(),
    })
    expect(caderno.map((e) => e.questaoId).sort()).toEqual(['a', 'c'])
    expect(caderno.find((e) => e.questaoId === 'a')?.status).toBe('ABERTO')
    expect(caderno.find((e) => e.questaoId === 'c')?.status).toBe('CORRIGIDO')
  })

  it('marcado como resolvido prevalece', () => {
    const caderno = montarCadernoErros({
      respostas: [resp('a', false, 1)],
      registros: [
        {
          questaoId: 'a',
          motivo: 'PEGADINHA',
          conceitoCorreto: 'X',
          anotacao: null,
          resolvido: true,
        },
      ],
      metadados: new Map(),
      proximasRevisoes: new Map(),
    })
    expect(caderno[0]?.status).toBe('RESOLVIDO')
    expect(caderno[0]?.motivo).toBe('PEGADINHA')
  })

  it('ordena abertos primeiro, do erro mais recente para o mais antigo', () => {
    const caderno = montarCadernoErros({
      respostas: [
        resp('velho', false, 1),
        resp('novo', false, 9),
        resp('ok', false, 5),
        resp('ok', true, 6),
      ],
      registros: [],
      metadados: new Map(),
      proximasRevisoes: new Map(),
    })
    expect(caderno.map((e) => e.questaoId)).toEqual(['novo', 'velho', 'ok'])
  })
})

describe('detectarPadroesErro', () => {
  const entrada = (
    questaoId: string,
    tema: string | null,
    motivo: EntradaCaderno['motivo'] = null,
  ): EntradaCaderno => ({
    questaoId,
    tema,
    area: 'Clínica Médica',
    status: 'ABERTO',
    tentativas: 1,
    erros: 1,
    ultimoErroEm: new Date(),
    motivo,
    conceitoCorreto: null,
    anotacao: null,
    proximaRevisao: null,
  })

  it('aponta tema com 3+ erros abertos como possível deficiência conceitual', () => {
    const padroes = detectarPadroesErro([
      entrada('1', 'Gasometria', 'CONCEITO_ERRADO'),
      entrada('2', 'Gasometria', 'CONCEITO_ERRADO'),
      entrada('3', 'Gasometria', 'LEITURA_ENUNCIADO'),
      entrada('4', 'Asma'),
    ])
    expect(padroes).toHaveLength(1)
    expect(padroes[0]).toMatchObject({
      tema: 'Gasometria',
      quantidade: 3,
      motivoPredominante: 'CONCEITO_ERRADO',
    })
  })

  it('ignora erros resolvidos/corrigidos e questões sem tema', () => {
    const corrigida = { ...entrada('3', 'Gasometria'), status: 'CORRIGIDO' as const }
    expect(
      detectarPadroesErro([
        entrada('1', 'Gasometria'),
        entrada('2', 'Gasometria'),
        corrigida,
        entrada('x', null),
        entrada('y', null),
        entrada('z', null),
      ]),
    ).toEqual([])
  })
})
