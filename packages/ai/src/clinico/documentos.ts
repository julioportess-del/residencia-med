import type { EstruturaClinica } from './tipos'

/**
 * Documentos clinicos derivados da MESMA EstruturaClinica ja extraida da
 * consulta. Sao renders deterministas (sem nova chamada de IA) — varios
 * documentos a partir de uma transcricao, instantaneo e sem custo extra.
 *
 * Tudo aqui e RASCUNHO para revisao medica. CID, posologia e condutas sao
 * sugestoes. O identificador do paciente (`pacienteIniciais`) pode ser o nome
 * completo ou iniciais, conforme preenchido pelo medico.
 */

export type TipoDocumento =
  | 'ATESTADO'
  | 'RECEITA'
  | 'SOLICITACAO_EXAMES'
  | 'ENCAMINHAMENTO'
  | 'ORIENTACOES_PACIENTE'
  | 'RESUMO_CONSULTA'

export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  ATESTADO: 'Atestado médico',
  RECEITA: 'Receituário',
  SOLICITACAO_EXAMES: 'Solicitação de exames',
  ENCAMINHAMENTO: 'Encaminhamento',
  ORIENTACOES_PACIENTE: 'Orientações ao paciente',
  RESUMO_CONSULTA: 'Resumo da consulta',
}

export interface ContextoDocumento {
  pacienteIniciais: string
  data?: Date
  medicoNome?: string
}

export interface OpcoesAtestado {
  dias?: number
  incluirCid?: boolean
  observacao?: string
}

const ASSINATURA = '_______________________________\nMédico(a) — CRM ______ • Assinatura/carimbo'

function formatarData(data: Date): string {
  const dd = String(data.getDate()).padStart(2, '0')
  const mm = String(data.getMonth() + 1).padStart(2, '0')
  const yyyy = data.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function cabecalho(titulo: string, ctx: ContextoDocumento): string {
  const data = formatarData(ctx.data ?? new Date())
  return `${titulo}\n\nPaciente: ${ctx.pacienteIniciais}\nData: ${data}`
}

function numerar(itens: string[]): string {
  return itens.map((item, i) => `${i + 1}. ${item}`).join('\n')
}

function listaCid(e: EstruturaClinica): string | null {
  const cids = e.avaliacao.cidSugerido
  if (!cids || cids.length === 0) return null
  return cids.map((c) => `${c.codigo} — ${c.descricao}`).join('; ')
}

/** Atestado de comparecimento/afastamento. `dias` e opcional. */
export function renderizarAtestado(
  e: EstruturaClinica,
  ctx: ContextoDocumento,
  opcoes: OpcoesAtestado = {},
): string {
  const data = formatarData(ctx.data ?? new Date())
  const afastamento =
    opcoes.dias && opcoes.dias > 0
      ? ` e necessita de afastamento de suas atividades habituais por ${opcoes.dias} dia(s) a partir desta data`
      : ''
  const cid = opcoes.incluirCid ? listaCid(e) : null
  const linhas = [
    'ATESTADO MÉDICO',
    '',
    `Atesto, para os devidos fins, que o(a) paciente ${ctx.pacienteIniciais} esteve sob atendimento médico nesta data (${data})${afastamento}.`,
    opcoes.observacao ? `\nObservação: ${opcoes.observacao}` : null,
    cid ? `\nCID-10 (a critério do paciente informar): ${cid}` : null,
    '',
    ASSINATURA,
  ].filter((l): l is string => l !== null)
  return linhas.join('\n').trim()
}

/** Receituario a partir das prescricoes. */
export function renderizarReceita(e: EstruturaClinica, ctx: ContextoDocumento): string {
  const itens = e.plano.prescricoes ?? []
  const corpo =
    itens.length > 0
      ? numerar(itens)
      : '(Nenhuma prescrição foi identificada na consulta. Adicione manualmente se necessário.)'
  return [cabecalho('RECEITUÁRIO', ctx), '', corpo, '', ASSINATURA].join('\n').trim()
}

/** Solicitacao de exames complementares. */
export function renderizarSolicitacaoExames(e: EstruturaClinica, ctx: ContextoDocumento): string {
  const itens = e.plano.examesSolicitados ?? []
  const hipoteses = e.avaliacao.hipotesesDiagnosticas
  const corpo =
    itens.length > 0
      ? numerar(itens)
      : '(Nenhum exame foi identificado na consulta. Adicione manualmente se necessário.)'
  const indicacao = hipoteses?.length ? `\n\nIndicação clínica: ${hipoteses.join('; ')}` : ''
  return [cabecalho('SOLICITAÇÃO DE EXAMES', ctx), '', corpo, indicacao, '', ASSINATURA]
    .join('\n')
    .trim()
}

/** Carta de encaminhamento com resumo clinico e CID sugerido. */
export function renderizarEncaminhamento(e: EstruturaClinica, ctx: ContextoDocumento): string {
  const destinos = e.plano.encaminhamentos ?? []
  const destino =
    destinos.length > 0 ? destinos.join('; ') : '(especialidade/serviço a definir)'
  const resumo =
    e.narrativaCorrida?.trim() ||
    [
      e.subjetivo.queixaPrincipal,
      e.subjetivo.historiaDoencaAtual,
      e.avaliacao.raciocinioClinico,
    ]
      .filter(Boolean)
      .join(' ')
  const cid = listaCid(e)
  const linhas = [
    cabecalho('ENCAMINHAMENTO', ctx),
    '',
    `Encaminho para: ${destino}`,
    '',
    resumo ? `Resumo clínico: ${resumo}` : null,
    e.subjetivo.medicacoesEmUso?.length
      ? `Medicações em uso: ${e.subjetivo.medicacoesEmUso.join('; ')}`
      : null,
    cid ? `Hipótese (CID-10 sugerido, revisar): ${cid}` : null,
    '',
    ASSINATURA,
  ].filter((l): l is string => l !== null)
  return linhas.join('\n').trim()
}

/** Orientacoes em linguagem acessivel para o paciente levar para casa. */
export function renderizarOrientacoesPaciente(
  e: EstruturaClinica,
  ctx: ContextoDocumento,
): string {
  const orientacoes = e.plano.orientacoes ?? []
  const alertas = e.plano.sinaisDeAlerta ?? []
  const blocos: string[] = [`ORIENTAÇÕES PARA O PACIENTE (${ctx.pacienteIniciais})`, '']

  if (orientacoes.length > 0) {
    blocos.push('O que fazer:', orientacoes.map((o) => `• ${o}`).join('\n'), '')
  }
  if (e.plano.prescricoes?.length) {
    blocos.push('Medicações:', e.plano.prescricoes.map((p) => `• ${p}`).join('\n'), '')
  }
  if (e.plano.retorno?.trim()) {
    blocos.push(`Retorno: ${e.plano.retorno.trim()}`, '')
  }
  if (alertas.length > 0) {
    blocos.push(
      'Procure atendimento se apresentar:',
      alertas.map((a) => `• ${a}`).join('\n'),
      '',
    )
  }
  if (blocos.length === 2) {
    blocos.push('(Sem orientações específicas registradas. Adicione manualmente.)')
  }
  return blocos.join('\n').trim()
}

/** Resumo corrido da consulta (reaproveita a narrativa). */
export function renderizarResumoConsulta(e: EstruturaClinica, ctx: ContextoDocumento): string {
  const corpo =
    e.narrativaCorrida?.trim() ||
    [
      e.subjetivo.queixaPrincipal,
      e.subjetivo.historiaDoencaAtual,
      e.avaliacao.hipotesesDiagnosticas?.join('; '),
      e.plano.conduta,
    ]
      .filter(Boolean)
      .join(' ')
  return [cabecalho('RESUMO DA CONSULTA', ctx), '', corpo || '(Sem conteúdo.)'].join('\n').trim()
}

/** Documentos que tem conteudo util dada a estrutura (para nao oferecer vazios). */
export function documentosDisponiveis(e: EstruturaClinica): TipoDocumento[] {
  const lista: TipoDocumento[] = ['ATESTADO', 'RESUMO_CONSULTA', 'ORIENTACOES_PACIENTE']
  if (e.plano.prescricoes?.length) lista.push('RECEITA')
  if (e.plano.examesSolicitados?.length) lista.push('SOLICITACAO_EXAMES')
  if (e.plano.encaminhamentos?.length || e.avaliacao.cidSugerido?.length) {
    lista.push('ENCAMINHAMENTO')
  }
  return lista
}

/** Dispatcher: renderiza o documento pedido. */
export function renderizarDocumento(
  tipo: TipoDocumento,
  e: EstruturaClinica,
  ctx: ContextoDocumento,
  opcoes?: OpcoesAtestado,
): string {
  switch (tipo) {
    case 'ATESTADO':
      return renderizarAtestado(e, ctx, opcoes)
    case 'RECEITA':
      return renderizarReceita(e, ctx)
    case 'SOLICITACAO_EXAMES':
      return renderizarSolicitacaoExames(e, ctx)
    case 'ENCAMINHAMENTO':
      return renderizarEncaminhamento(e, ctx)
    case 'ORIENTACOES_PACIENTE':
      return renderizarOrientacoesPaciente(e, ctx)
    case 'RESUMO_CONSULTA':
      return renderizarResumoConsulta(e, ctx)
  }
}
