import { z } from 'zod'

export const ConfiancaSchema = z.enum(['CHUTE', 'INCERTO', 'CONFIANTE', 'NAO_SEI'])
export type Confianca = z.infer<typeof ConfiancaSchema>

export const DificuldadeSchema = z.enum(['FACIL', 'MEDIO', 'DIFICIL', 'MUITO_DIFICIL'])
export type Dificuldade = z.infer<typeof DificuldadeSchema>

export const TipoSessaoSchema = z.enum(['ESTUDO', 'SIMULADO', 'REVISAO', 'LIVRE'])
export type TipoSessao = z.infer<typeof TipoSessaoSchema>

export const ResponderQuestaoInput = z.object({
  questaoId: z.string().cuid(),
  alternativaLetra: z.enum(['A', 'B', 'C', 'D', 'E']),
  tempoSegundos: z.number().int().positive().max(3600),
  confianca: ConfiancaSchema.optional(),
  sessaoId: z.string().cuid().optional(),
  modoRevisao: z.boolean().default(false),
})
export type ResponderQuestaoInput = z.infer<typeof ResponderQuestaoInput>

export const SituacaoQuestaoSchema = z.enum([
  'TODAS',
  'INEDITAS',
  'RESPONDIDAS',
  'ERRADAS',
  'ACERTADAS',
  'CHUTES_CERTOS',
  'CERTEZA_ERRADA',
  'REVISAO_VENCIDA',
])

/** Filtros combináveis do banco de questões (todos opcionais, AND entre si). */
export const FiltrosBancoSchema = z.object({
  bancaIds: z.array(z.string().cuid()).optional(),
  temaIds: z.array(z.string().cuid()).optional(),
  especialidadeIds: z.array(z.string().cuid()).optional(),
  dificuldades: z.array(DificuldadeSchema).optional(),
  anos: z.array(z.number().int()).optional(),
  situacao: SituacaoQuestaoSchema.default('TODAS'),
  query: z.string().trim().max(120).optional(),
})
export type FiltrosBanco = z.infer<typeof FiltrosBancoSchema>

export const CriarSessaoInput = z.object({
  tipo: TipoSessaoSchema,
  bancaId: z.string().cuid().optional(),
  filtros: FiltrosBancoSchema.default({}),
  numeroQuestoes: z.number().int().min(1).max(120).default(20),
  tempoMinutos: z.number().int().positive().optional(),
  /** SEQUENCIAL = ordem original da prova (prova histórica); ALEATORIA = embaralhada. */
  ordem: z.enum(['ALEATORIA', 'SEQUENCIAL']).default('ALEATORIA'),
})
export type CriarSessaoInput = z.infer<typeof CriarSessaoInput>

export const OnboardingInput = z.object({
  bancasAlvo: z.array(z.string().cuid()).min(1).max(5),
  dataProva: z.coerce.date().refine((d) => d > new Date(), {
    message: 'Data da prova deve ser futura',
  }),
  cargaHorariaSemanal: z.number().int().min(2).max(80),
  autoavaliacao: z.record(z.string(), z.number().int().min(1).max(5)).default({}),
})
export type OnboardingInput = z.infer<typeof OnboardingInput>

export const FiltroQuestoesInput = FiltrosBancoSchema.extend({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
})
export type FiltroQuestoesInput = z.infer<typeof FiltroQuestoesInput>

// ==================== MINHAS PROVAS ====================

const DataCalendario = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'Data inválida')

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s === '' ? null : s))
    .nullable()

export const ProcessoSeletivoInput = z
  .object({
    instituicao: z.string().trim().min(1, 'Informe a instituição').max(120),
    bancaId: z.string().cuid().nullable(),
    especialidade: z.string().trim().min(1, 'Informe a especialidade').max(120),
    numeroInscricao: textoOpcional(60),
    editalPublicado: z.boolean(),
    linkEdital: z
      .string()
      .trim()
      .max(500)
      .refine((s) => s === '' || /^https?:\/\//i.test(s), 'Use um link http(s)')
      .transform((s) => (s === '' ? null : s))
      .nullable(),
    inscricaoFeita: z.boolean(),
    inscricaoPaga: z.boolean(),
    taxaInscricaoCentavos: z.number().int().min(0).max(10_000_000).nullable(),
    logisticaOrganizada: z.boolean(),
    cidadeProva: textoOpcional(120),
    inicioInscricoes: DataCalendario.nullable(),
    fimInscricoes: DataCalendario.nullable(),
    dataProva: DataCalendario.nullable(),
    provaRealizada: z.boolean(),
    acertos: z.number().int().min(0).max(1000).nullable(),
    totalQuestoes: z.number().int().min(1).max(1000).nullable(),
    observacoes: textoOpcional(2000),
  })
  .refine((v) => !v.inicioInscricoes || !v.fimInscricoes || v.inicioInscricoes <= v.fimInscricoes, {
    message: 'O fim das inscrições deve ser depois do início',
    path: ['fimInscricoes'],
  })
  .refine((v) => v.acertos === null || v.totalQuestoes === null || v.acertos <= v.totalQuestoes, {
    message: 'Acertos não pode passar do total de questões',
    path: ['acertos'],
  })
export type ProcessoSeletivoInput = z.infer<typeof ProcessoSeletivoInput>
