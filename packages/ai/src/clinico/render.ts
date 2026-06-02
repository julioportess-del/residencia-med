import type { EstruturaClinica, ModeloEvolucaoTexto } from './tipos'

/** Junta um array em linhas com bullet, ou null se vazio. */
function lista(itens?: string[]): string | null {
  if (!itens || itens.length === 0) return null
  return itens.map((i) => `- ${i}`).join('\n')
}

/** Acrescenta "Rotulo: valor" a um buffer se valor existir. */
function linha(rotulo: string, valor?: string | null): string | null {
  const v = valor?.trim()
  return v ? `${rotulo}: ${v}` : null
}

function blocosSubjetivo(e: EstruturaClinica): string[] {
  const s = e.subjetivo
  return [
    linha('Queixa principal', s.queixaPrincipal),
    linha('HDA', s.historiaDoencaAtual),
    s.antecedentesPessoais?.length ? `Antecedentes pessoais:\n${lista(s.antecedentesPessoais)}` : null,
    s.antecedentesFamiliares?.length
      ? `Antecedentes familiares:\n${lista(s.antecedentesFamiliares)}`
      : null,
    s.medicacoesEmUso?.length ? `Medicacoes em uso:\n${lista(s.medicacoesEmUso)}` : null,
    s.alergias?.length ? `Alergias:\n${lista(s.alergias)}` : null,
    s.habitosVida?.length ? `Habitos de vida:\n${lista(s.habitosVida)}` : null,
  ].filter((x): x is string => x !== null)
}

function blocosObjetivo(e: EstruturaClinica): string[] {
  const o = e.objetivo
  return [
    linha('Sinais vitais', o.sinaisVitais),
    linha('Exame fisico', o.exameFisico),
    o.examesComplementares?.length
      ? `Exames complementares:\n${lista(o.examesComplementares)}`
      : null,
  ].filter((x): x is string => x !== null)
}

function blocosAvaliacao(e: EstruturaClinica): string[] {
  const a = e.avaliacao
  const cid = a.cidSugerido?.length
    ? `CID sugerido (revisar):\n${a.cidSugerido.map((c) => `- ${c.codigo} — ${c.descricao}`).join('\n')}`
    : null
  return [
    a.hipotesesDiagnosticas?.length
      ? `Hipoteses diagnosticas:\n${lista(a.hipotesesDiagnosticas)}`
      : null,
    cid,
    linha('Raciocinio clinico', a.raciocinioClinico),
  ].filter((x): x is string => x !== null)
}

function blocosPlano(e: EstruturaClinica): string[] {
  const p = e.plano
  return [
    linha('Conduta', p.conduta),
    p.prescricoes?.length ? `Prescricoes:\n${lista(p.prescricoes)}` : null,
    p.examesSolicitados?.length ? `Exames solicitados:\n${lista(p.examesSolicitados)}` : null,
    p.orientacoes?.length ? `Orientacoes:\n${lista(p.orientacoes)}` : null,
    p.encaminhamentos?.length ? `Encaminhamentos:\n${lista(p.encaminhamentos)}` : null,
    linha('Retorno', p.retorno),
    p.sinaisDeAlerta?.length ? `Sinais de alerta:\n${lista(p.sinaisDeAlerta)}` : null,
  ].filter((x): x is string => x !== null)
}

function secao(titulo: string, blocos: string[]): string | null {
  if (blocos.length === 0) return null
  return `${titulo}\n${blocos.join('\n')}`
}

/** Evolucao SOAP: secoes S / O / A / P rotuladas. */
export function renderizarSoap(e: EstruturaClinica): string {
  const secoes = [
    secao('# S — Subjetivo', blocosSubjetivo(e)),
    secao('# O — Objetivo', blocosObjetivo(e)),
    secao('# A — Avaliacao', blocosAvaliacao(e)),
    secao('# P — Plano', blocosPlano(e)),
  ].filter((x): x is string => x !== null)
  return secoes.join('\n\n').trim()
}

/** Evolucao corrida: narrativa em prosa; fallback monta a partir dos blocos. */
export function renderizarCorrida(e: EstruturaClinica): string {
  const narrativa = e.narrativaCorrida?.trim()
  if (narrativa) return narrativa
  // Fallback: concatena os blocos em texto continuo.
  const todos = [
    ...blocosSubjetivo(e),
    ...blocosObjetivo(e),
    ...blocosAvaliacao(e),
    ...blocosPlano(e),
  ]
  return todos.join(' ').replace(/\n+/g, ' ').trim()
}

/** Evolucao UBS: formato enxuto p/ atencao primaria (queixa, exame, conduta). */
export function renderizarUbs(e: EstruturaClinica): string {
  const s = e.subjetivo
  const a = e.avaliacao
  const queixa = [s.queixaPrincipal, s.historiaDoencaAtual].filter(Boolean).join('. ')
  const blocos = [
    queixa ? `Subjetivo: ${queixa}` : null,
    secao('Objetivo:', blocosObjetivo(e)),
    a.hipotesesDiagnosticas?.length ? `Avaliacao: ${a.hipotesesDiagnosticas.join('; ')}` : null,
    secao('Plano:', blocosPlano(e)),
  ].filter((x): x is string => x !== null)
  return blocos.join('\n\n').trim()
}

export interface EvolucoesRenderizadas {
  soap: string
  corrida: string
  ubs: string
}

/** Renderiza os tres formatos de evolucao a partir da estrutura clinica. */
export function renderizarEvolucoes(e: EstruturaClinica): EvolucoesRenderizadas {
  return {
    soap: renderizarSoap(e),
    corrida: renderizarCorrida(e),
    ubs: renderizarUbs(e),
  }
}

export function renderizarModelo(e: EstruturaClinica, modelo: ModeloEvolucaoTexto): string {
  if (modelo === 'CORRIDA') return renderizarCorrida(e)
  if (modelo === 'UBS') return renderizarUbs(e)
  return renderizarSoap(e)
}
