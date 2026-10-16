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
