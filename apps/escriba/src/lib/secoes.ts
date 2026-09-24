import type { EstruturaClinica } from '@residencia-med/ai/clinico'

/**
 * Deriva as áreas copiáveis do prontuário (Resumo, Prescrições, Exames,
 * Orientações, Pendências) da estrutura clínica persistida — sem chamada
 * de IA. Compartilhado entre a UI web (SecoesViewer) e a API da extensão
 * Chrome (revisão no widget dentro do Feegow). Seções vazias são omitidas.
 */

export interface SecaoTexto {
  chave: 'resumo' | 'exameFisico' | 'prescricoes' | 'exames' | 'orientacoes' | 'pendencias'
  titulo: string
  texto: string
}

function juntar(linhas: (string | undefined | null)[]): string {
  return linhas.filter((l): l is string => Boolean(l && l.trim())).join('\n')
}

function lista(itens: string[] | undefined, prefixo = '- '): string {
  return (itens ?? [])
    .filter((i) => i.trim())
    .map((i) => `${prefixo}${i}`)
    .join('\n')
}

export function montarSecoesTexto(e: EstruturaClinica): SecaoTexto[] {
  const cids = (e.avaliacao.cidSugerido ?? []).map((c) => `${c.codigo} — ${c.descricao}`).join('; ')

  const resumo = juntar([
    e.subjetivo.queixaPrincipal ? `Queixa: ${e.subjetivo.queixaPrincipal}` : null,
    e.avaliacao.hipotesesDiagnosticas?.length
      ? `Hipóteses: ${e.avaliacao.hipotesesDiagnosticas.join('; ')}`
      : null,
    cids ? `CID sugerido: ${cids}` : null,
    e.plano.conduta ? `Conduta: ${e.plano.conduta}` : null,
  ])

  const prescricoes = lista(e.plano.prescricoes)

  const exames = juntar([
    e.objetivo.examesComplementares?.length
      ? `Resultados avaliados:\n${lista(e.objetivo.examesComplementares)}`
      : null,
    e.plano.examesSolicitados?.length ? `Solicitados:\n${lista(e.plano.examesSolicitados)}` : null,
  ])

  const orientacoes = juntar([
    lista(e.plano.orientacoes) || null,
    e.plano.sinaisDeAlerta?.length ? `Sinais de alerta:\n${lista(e.plano.sinaisDeAlerta)}` : null,
  ])

  const pendencias = juntar([
    e.plano.retorno ? `Retorno: ${e.plano.retorno}` : null,
    e.plano.encaminhamentos?.length ? `Encaminhamentos:\n${lista(e.plano.encaminhamentos)}` : null,
  ])

  // EXAME FÍSICO: só o que foi dito na consulta ou escrito pelo médico no
  // editor — sugestões da IA são dica de UI e não entram no texto copiável.
  const exameFisico =
    e.objetivo.exameFisico?.trim() ??
    'Nenhum achado de exame físico foi registrado durante a consulta.'

  const todas: SecaoTexto[] = [
    { chave: 'resumo', titulo: 'Resumo', texto: resumo },
    { chave: 'exameFisico', titulo: 'Exame físico', texto: exameFisico },
    { chave: 'prescricoes', titulo: 'Prescrições', texto: prescricoes },
    { chave: 'exames', titulo: 'Exames', texto: exames },
    { chave: 'orientacoes', titulo: 'Orientações', texto: orientacoes },
    { chave: 'pendencias', titulo: 'Pendências', texto: pendencias },
  ]

  return todas.filter((s) => s.texto.trim().length > 0)
}
