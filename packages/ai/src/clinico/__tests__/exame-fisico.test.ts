import { describe, expect, test } from 'vitest'
import { estruturaClinicaSchema } from '../tipos'
import { renderizarCorrida, renderizarSoap, renderizarUbs, secaoExameFisico } from '../render'

const base = estruturaClinicaSchema.parse({})

describe('seção EXAME FÍSICO', () => {
  test('sem achados: registra ausência explícita, NUNCA "normal"', () => {
    const texto = secaoExameFisico(base)
    expect(texto).toContain('EXAME FISICO')
    expect(texto).toContain('Nenhum achado de exame fisico foi registrado')
    expect(texto.toLowerCase()).not.toContain('normal')
    expect(texto.toLowerCase()).not.toContain('sem alteracoes')
  })

  test('achados documentados aparecem apenas quando existem na estrutura', () => {
    const e = estruturaClinicaSchema.parse({
      objetivo: { exameFisico: 'Ausculta pulmonar com sibilos difusos. SatO2 94%.' },
    })
    const texto = secaoExameFisico(e)
    expect(texto).toContain('Achados documentados durante a consulta:')
    expect(texto).toContain('sibilos difusos')
    expect(texto).not.toContain('Nenhum achado')
  })

  test('sugestões são campos a preencher, claramente separados dos achados', () => {
    const e = estruturaClinicaSchema.parse({
      objetivo: {
        sugestoesExameFisico: ['Ausculta pulmonar', 'Frequencia respiratoria'],
      },
    })
    const texto = secaoExameFisico(e)
    expect(texto).toContain('Sugestoes para complementacao')
    expect(texto).toContain('nao sao achados')
    expect(texto).toContain('( ) Ausculta pulmonar: ___')
    expect(texto).toContain('( ) Frequencia respiratoria: ___')
  })

  test('os três formatos de evolução incluem a seção obrigatória', () => {
    expect(renderizarSoap(base)).toContain('EXAME FISICO')
    expect(renderizarUbs(base)).toContain('EXAME FISICO')
    expect(
      renderizarCorrida(estruturaClinicaSchema.parse({ narrativaCorrida: 'Paciente estável.' })),
    ).toContain('EXAME FISICO')
  })

  test('dados antigos (sem o campo novo) continuam válidos no schema', () => {
    const antigo = estruturaClinicaSchema.safeParse({
      objetivo: { exameFisico: 'Abdome flácido.' },
    })
    expect(antigo.success).toBe(true)
  })
})
