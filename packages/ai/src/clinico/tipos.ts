import { z } from 'zod'

/**
 * Estrutura clinica extraida da transcricao filtrada de uma consulta.
 * Espelha o raciocinio SOAP. Todos os campos sao opcionais porque uma
 * consulta real pode nao cobrir tudo — a IA so preenche o que foi dito.
 *
 * IMPORTANTE: CID e condutas sao SUGESTOES geradas por IA. Exigem revisao
 * medica obrigatoria antes de virarem prontuario oficial.
 */

export const cidSugeridoSchema = z.object({
  codigo: z.string(),
  descricao: z.string(),
})

export const subjetivoSchema = z.object({
  queixaPrincipal: z.string().optional(),
  historiaDoencaAtual: z.string().optional(),
  antecedentesPessoais: z.array(z.string()).optional(),
  antecedentesFamiliares: z.array(z.string()).optional(),
  medicacoesEmUso: z.array(z.string()).optional(),
  alergias: z.array(z.string()).optional(),
  habitosVida: z.array(z.string()).optional(),
})

export const objetivoSchema = z.object({
  sinaisVitais: z.string().optional(),
  /** SOMENTE achados de exame fisico explicitamente ditos na consulta. */
  exameFisico: z.string().optional(),
  /**
   * Itens de exame fisico SUGERIDOS pela IA conforme o contexto clinico
   * (queixa, sintomas, sistemas abordados) para o medico avaliar e
   * preencher. NUNCA sao achados — aparecem sempre separados, como
   * lembretes editaveis, jamais como "normal"/"sem alteracoes".
   */
  sugestoesExameFisico: z.array(z.string()).optional(),
  examesComplementares: z.array(z.string()).optional(),
})

export const avaliacaoSchema = z.object({
  hipotesesDiagnosticas: z.array(z.string()).optional(),
  cidSugerido: z.array(cidSugeridoSchema).optional(),
  raciocinioClinico: z.string().optional(),
})

export const planoSchema = z.object({
  conduta: z.string().optional(),
  prescricoes: z.array(z.string()).optional(),
  examesSolicitados: z.array(z.string()).optional(),
  orientacoes: z.array(z.string()).optional(),
  encaminhamentos: z.array(z.string()).optional(),
  retorno: z.string().optional(),
  sinaisDeAlerta: z.array(z.string()).optional(),
})

export const estruturaClinicaSchema = z.object({
  subjetivo: subjetivoSchema.default({}),
  objetivo: objetivoSchema.default({}),
  avaliacao: avaliacaoSchema.default({}),
  plano: planoSchema.default({}),
  /** Narrativa em prosa para o modelo "evolucao corrida". */
  narrativaCorrida: z.string().optional(),
})

export type CidSugerido = z.infer<typeof cidSugeridoSchema>
export type Subjetivo = z.infer<typeof subjetivoSchema>
export type Objetivo = z.infer<typeof objetivoSchema>
export type Avaliacao = z.infer<typeof avaliacaoSchema>
export type Plano = z.infer<typeof planoSchema>
export type EstruturaClinica = z.infer<typeof estruturaClinicaSchema>

export type ModeloEvolucaoTexto = 'SOAP' | 'CORRIDA' | 'UBS'
