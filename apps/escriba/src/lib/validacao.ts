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
  // Vínculo OPT-IN a um cadastro de paciente (quando o médico ativou).
  pacienteId: z.string().trim().min(1).optional(),
  // Modelo de documento aplicado (guia a IA).
  modeloId: z.string().trim().min(1).optional(),
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
  // Opt-in do médico para cadastro de pacientes identificáveis (LGPD).
  cadastroPacientesAtivo: z.boolean().optional().default(false),
})

export type PreferenciasInput = z.infer<typeof preferenciasSchema>

// Cadastro OPT-IN de paciente (dado sensível LGPD). Campos opcionais aceitam "".
const listaTexto = z.array(z.string().trim().min(1).max(120)).max(40).optional().default([])

export const pacienteSchema = z.object({
  nomeCompleto: z
    .string()
    .trim()
    .min(2, 'Informe o nome do paciente.')
    .max(120, 'Nome muito longo (máx. 120).'),
  dataNascimento: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
    .optional()
    .or(z.literal('')),
  cpf: z
    .string()
    .trim()
    .max(14)
    .regex(/^[\d.\-/]*$/, 'CPF deve conter apenas números.')
    .optional()
    .or(z.literal('')),
  email: z.string().trim().email('E-mail inválido.').optional().or(z.literal('')),
  telefone: z.string().trim().max(30).optional().or(z.literal('')),
  endereco: z.string().trim().max(200).optional().or(z.literal('')),
  alergias: listaTexto,
  medicamentos: listaTexto,
  condicoesCronicas: listaTexto,
  antecedentes: z.string().trim().max(1000).optional().or(z.literal('')),
  consentimentoCadastro: z.boolean(),
})

export type PacienteInput = z.infer<typeof pacienteSchema>

// Modelo de documento (template que guia a IA na estruturação).
export const TIPO_DOC_MODELO_VALORES = [
  'EVOLUCAO',
  'RECEITUARIO',
  'ATESTADO',
  'SOLICITACAO_EXAMES',
  'RESUMO',
  'OUTRO',
] as const

export type TipoDocModelo = (typeof TIPO_DOC_MODELO_VALORES)[number]
export type FormatoEvolucao = (typeof MODELO_EVOLUCAO_VALORES)[number]

export const modeloSchema = z.object({
  nome: z.string().trim().min(2, 'Dê um nome ao modelo.').max(80, 'Nome muito longo.'),
  especialidade: z.string().trim().max(80).optional().or(z.literal('')),
  tipoDocumento: z.enum(TIPO_DOC_MODELO_VALORES).optional().default('EVOLUCAO'),
  instrucoes: z
    .string()
    .trim()
    .min(5, 'Descreva as instruções que a IA deve seguir.')
    .max(2000, 'Instruções muito longas (máx. 2000).'),
  formatoBase: z.enum(MODELO_EVOLUCAO_VALORES).optional().default('SOAP'),
})

export type ModeloInput = z.infer<typeof modeloSchema>

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
