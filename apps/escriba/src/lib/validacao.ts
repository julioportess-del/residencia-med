import { z } from 'zod'

export const TIPO_CONSULTA_VALORES = [
  'DEMANDA_ESPONTANEA',
  'HIPERTENSAO',
  'DIABETES',
  'RENOVACAO_RECEITA',
  'AVALIACAO_EXAMES',
  'SAUDE_MENTAL',
  'PUERICULTURA',
  'SAUDE_DA_MULHER',
  'DOR_LOMBAR',
  'CEFALEIA',
  'IVAS',
  'DOR_ABDOMINAL',
  'ANSIEDADE',
  'ENCAMINHAMENTO',
  'OUTRO',
] as const

export const novaConsultaSchema = z.object({
  pacienteIniciais: z
    .string()
    .trim()
    .min(1, 'Informe as iniciais do paciente.')
    .max(8, 'Use apenas as iniciais (máx. 8 caracteres).')
    .regex(/^[\p{L}.\s-]+$/u, 'Use somente letras, pontos e espaços.'),
  tipoConsulta: z.enum(TIPO_CONSULTA_VALORES),
  consentimentoConfirmado: z.literal(true, {
    errorMap: () => ({ message: 'O consentimento do paciente é obrigatório.' }),
  }),
})

export type NovaConsultaInput = z.infer<typeof novaConsultaSchema>

export const MODELO_EVOLUCAO_VALORES = ['SOAP', 'CORRIDA', 'UBS'] as const

export const preferenciasSchema = z.object({
  especialidade: z
    .string()
    .trim()
    .max(80, 'Especialidade muito longa (máx. 80 caracteres).')
    .optional()
    .or(z.literal('')),
  instrucoesCustom: z
    .string()
    .trim()
    .max(1000, 'Instruções muito longas (máx. 1000 caracteres).')
    .optional()
    .or(z.literal('')),
  formatoPadrao: z.enum(MODELO_EVOLUCAO_VALORES),
})

export type PreferenciasInput = z.infer<typeof preferenciasSchema>
