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
  // Identificação do paciente: aceita nome completo ou iniciais. Bloqueia
  // dígitos de propósito, para evitar registro acidental de CPF/RG.
  pacienteIniciais: z
    .string()
    .trim()
    .min(2, 'Informe o nome (ou iniciais) do paciente.')
    .max(120, 'Nome muito longo (máx. 120 caracteres).')
    .regex(
      /^[\p{L}.\s'-]+$/u,
      'Use apenas letras, espaços, pontos, hífen e apóstrofo (sem números).',
    ),
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

const SENHA_MINIMA = 8

export const cadastroSchema = z
  .object({
    nome: z.string().trim().min(2, 'Informe seu nome.').max(80, 'Nome muito longo.'),
    email: z.string().trim().email('E-mail inválido.'),
    senha: z.string().min(SENHA_MINIMA, `A senha deve ter ao menos ${SENHA_MINIMA} caracteres.`),
    confirmarSenha: z.string(),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: 'As senhas não coincidem.',
    path: ['confirmarSenha'],
  })

export type CadastroInput = z.infer<typeof cadastroSchema>

export const recuperarSenhaSchema = z.object({
  email: z.string().trim().email('E-mail inválido.'),
})

export const redefinirSenhaSchema = z
  .object({
    senha: z.string().min(SENHA_MINIMA, `A senha deve ter ao menos ${SENHA_MINIMA} caracteres.`),
    confirmarSenha: z.string(),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: 'As senhas não coincidem.',
    path: ['confirmarSenha'],
  })
