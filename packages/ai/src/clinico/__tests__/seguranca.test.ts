import { describe, expect, test } from 'vitest'
import { verificarSegurancaClinica } from '../seguranca'
import { classificarNivelEvidencia } from '../evidencias'

describe('Clinical Safety Engine', () => {
  test('alergia conhecida batendo com prescrição vira alerta CRÍTICO', () => {
    const alertas = verificarSegurancaClinica({
      alergias: ['Dipirona'],
      medicamentosEmUso: ['Losartana 50mg'],
      prescricoes: ['Dipirona 500mg VO 6/6h se dor'],
    })
    expect(alertas.some((a) => a.tipo === 'ALERGIA' && a.gravidade === 'CRITICO')).toBe(true)
  })

  test('match ignora acento/caixa (penicilina × Penicilína)', () => {
    const alertas = verificarSegurancaClinica({
      alergias: ['penicilína'],
      medicamentosEmUso: [],
      prescricoes: ['Penicilina benzatina 1.200.000 UI IM dose única'],
    })
    expect(alertas.some((a) => a.tipo === 'ALERGIA')).toBe(true)
  })

  test('mesmo fármaco em uso e sugerido vira alerta de DUPLICIDADE', () => {
    const alertas = verificarSegurancaClinica({
      alergias: ['AAS'],
      medicamentosEmUso: ['Metformina 850mg 2x/dia'],
      prescricoes: ['Metformina 500mg VO 12/12h'],
    })
    expect(alertas.some((a) => a.tipo === 'DUPLICIDADE')).toBe(true)
  })

  test('lista de medicamentos desconhecida NUNCA passa em silêncio', () => {
    const alertas = verificarSegurancaClinica({
      alergias: ['Dipirona'],
      medicamentosEmUso: null,
      prescricoes: ['Amoxicilina 500mg VO 8/8h por 7 dias'],
    })
    expect(alertas.some((a) => a.tipo === 'LISTA_MEDICAMENTOS_DESCONHECIDA')).toBe(true)
  })

  test('sem registro de alergias também alerta', () => {
    const alertas = verificarSegurancaClinica({
      alergias: [],
      medicamentosEmUso: ['Enalapril 10mg'],
      prescricoes: ['Ibuprofeno 400mg VO 8/8h'],
    })
    expect(alertas.some((a) => a.tipo === 'ALERGIAS_DESCONHECIDAS')).toBe(true)
  })

  test('sem prescrições sugeridas → sem alertas (nada a verificar)', () => {
    expect(
      verificarSegurancaClinica({ alergias: [], medicamentosEmUso: null, prescricoes: [] }),
    ).toHaveLength(0)
  })
})

describe('classificação de nível de evidência (determinística)', () => {
  test.each([
    ['Practice Guideline', 'DIRETRIZ'],
    ['Systematic Review, Meta-Analysis', 'REVISAO_SISTEMATICA'],
    ['Randomized Controlled Trial', 'ENSAIO_CLINICO'],
    ['Cohort study', 'OBSERVACIONAL'],
    ['Journal Article', 'OUTRO'],
  ])('%s → %s', (tipo, esperado) => {
    expect(classificarNivelEvidencia(tipo)).toBe(esperado)
  })
})
