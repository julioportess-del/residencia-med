import { z } from 'zod'

export const ConfiancaSchema = z.enum(['CHUTE', 'INCERTO', 'CONFIANTE'])
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

export const CriarSessaoInput = z.object({
  tipo: TipoSessaoSchema,
  bancaId: z.string().cuid().optional(),
  filtros: z
    .object({
      bancaIds: z.array(z.string().cuid()).optional(),
      temaIds: z.array(z.string().cuid()).optional(),
      dificuldades: z.array(DificuldadeSchema).optional(),
      anos: z.array(z.number().int()).optional(),
    })
    .default({}),
  numeroQuestoes: z.number().int().min(1).max(120).default(20),
  tempoMinutos: z.number().int().positive().optional(),
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

export const FiltroQuestoesInput = z.object({
  bancaIds: z.array(z.string().cuid()).optional(),
  temaIds: z.array(z.string().cuid()).optional(),
  especialidadeIds: z.array(z.string().cuid()).optional(),
  dificuldades: z.array(DificuldadeSchema).optional(),
  anos: z.array(z.number().int()).optional(),
  somenteNaoRespondidas: z.boolean().default(false),
  somenteErradas: z.boolean().default(false),
  query: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
})
export type FiltroQuestoesInput = z.infer<typeof FiltroQuestoesInput>
