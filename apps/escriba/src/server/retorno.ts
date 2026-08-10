import { prismaClinico } from '@residencia-med/db-clinico'
import { estruturaClinicaSchema } from '@residencia-med/ai/clinico'

/**
 * Retorno inteligente: recupera o contexto clínico da última consulta
 * concluída de um paciente (a partir da estrutura já persistida — sem
 * chamada de IA) para (a) mostrar um resumo ao médico antes do
 * atendimento e (b) servir de contexto à estruturação, sem misturar
 * fatos antigos com os novos.
 */

export interface ResumoRetorno {
  consultaId: string
  dataConsulta: string // ISO — serializável para o client
  diagnosticos: string[]
  medicamentos: string[]
  exames: string[]
  conduta: string | null
  orientacoes: string[]
  pendencias: string[]
}

function dataCurta(d: Date): string {
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export async function resumoUltimaConsulta(
  usuarioAuthId: string,
  pacienteId: string,
  ignorarConsultaId?: string,
): Promise<ResumoRetorno | null> {
  const anterior = await prismaClinico.consulta.findFirst({
    where: {
      usuarioAuthId,
      pacienteId,
      excluidoEm: null,
      status: { in: ['RASCUNHO', 'REVISADO'] },
      ...(ignorarConsultaId ? { id: { not: ignorarConsultaId } } : {}),
    },
    orderBy: { criadoEm: 'desc' },
    select: {
      id: true,
      criadoEm: true,
      evolucoes: {
        where: { dadosEstruturados: { not: undefined } },
        take: 1,
        select: { dadosEstruturados: true },
      },
    },
  })
  if (!anterior) return null

  const parse = estruturaClinicaSchema.safeParse(anterior.evolucoes[0]?.dadosEstruturados)
  if (!parse.success) return null
  const e = parse.data

  const diagnosticos = [
    ...(e.avaliacao.hipotesesDiagnosticas ?? []),
    ...(e.avaliacao.cidSugerido ?? []).map((c) => `${c.codigo} — ${c.descricao}`),
  ]
  const pendencias = [
    ...(e.plano.retorno ? [`Retorno combinado: ${e.plano.retorno}`] : []),
    ...(e.plano.encaminhamentos ?? []).map((x) => `Encaminhamento: ${x}`),
    ...(e.plano.examesSolicitados ?? []).map((x) => `Exame solicitado: ${x}`),
  ]

  return {
    consultaId: anterior.id,
    dataConsulta: anterior.criadoEm.toISOString(),
    diagnosticos,
    medicamentos: [...(e.plano.prescricoes ?? []), ...(e.subjetivo.medicacoesEmUso ?? [])],
    exames: e.objetivo.examesComplementares ?? [],
    conduta: e.plano.conduta ?? null,
    orientacoes: e.plano.orientacoes ?? [],
    pendencias,
  }
}

/**
 * Contexto textual da consulta anterior para a IA. Instrui explicitamente
 * a não misturar dados antigos com o relato novo.
 */
export function contextoRetornoParaIA(r: ResumoRetorno): string {
  const linhas = [
    `CONTEXTO DA CONSULTA ANTERIOR (${dataCurta(new Date(r.dataConsulta))}) — retorno do mesmo paciente:`,
    r.diagnosticos.length ? `- Diagnósticos/hipóteses: ${r.diagnosticos.join('; ')}` : null,
    r.medicamentos.length ? `- Medicamentos: ${r.medicamentos.join('; ')}` : null,
    r.exames.length ? `- Exames avaliados: ${r.exames.join('; ')}` : null,
    r.conduta ? `- Conduta anterior: ${r.conduta}` : null,
    r.pendencias.length ? `- Pendências: ${r.pendencias.join('; ')}` : null,
    'Use esse histórico apenas como contexto de continuidade (ex.: "mantém uso de X", "retorna para reavaliar Y").',
    'NÃO copie dados antigos para a evolução atual: registre somente o que foi dito nesta consulta.',
  ]
  return linhas.filter((l): l is string => Boolean(l)).join('\n')
}
