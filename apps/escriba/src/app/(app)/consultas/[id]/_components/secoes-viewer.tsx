'use client'

import { useState } from 'react'
import {
  Check,
  ClipboardCopy,
  ClipboardList,
  FlaskConical,
  MessageSquareText,
  Pill,
  AlarmClock,
} from 'lucide-react'
import type { EstruturaClinica } from '@residencia-med/ai/clinico'

/**
 * Visão do prontuário em áreas copiáveis individualmente (Resumo,
 * Prescrições, Exames, Orientações, Pendências), derivadas da estrutura
 * clínica já persistida — nenhuma chamada extra de IA. Seções vazias
 * não aparecem.
 */

interface Secao {
  chave: string
  titulo: string
  icone: React.ReactNode
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

export function montarSecoes(e: EstruturaClinica): Secao[] {
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

  const todas: Secao[] = [
    {
      chave: 'resumo',
      titulo: 'Resumo',
      icone: <MessageSquareText className="h-4 w-4" />,
      texto: resumo,
    },
    {
      chave: 'prescricoes',
      titulo: 'Prescrições',
      icone: <Pill className="h-4 w-4" />,
      texto: prescricoes,
    },
    {
      chave: 'exames',
      titulo: 'Exames',
      icone: <FlaskConical className="h-4 w-4" />,
      texto: exames,
    },
    {
      chave: 'orientacoes',
      titulo: 'Orientações',
      icone: <ClipboardList className="h-4 w-4" />,
      texto: orientacoes,
    },
    {
      chave: 'pendencias',
      titulo: 'Pendências',
      icone: <AlarmClock className="h-4 w-4" />,
      texto: pendencias,
    },
  ]

  return todas.filter((s) => s.texto.trim().length > 0)
}

export function SecoesViewer({ estrutura }: { estrutura: EstruturaClinica }) {
  const secoes = montarSecoes(estrutura)
  const [copiada, setCopiada] = useState<string | null>(null)

  if (secoes.length === 0) return null

  async function copiar(secao: Secao) {
    try {
      await navigator.clipboard.writeText(secao.texto)
      setCopiada(secao.chave)
      setTimeout(() => setCopiada(null), 2000)
    } catch {
      // Clipboard indisponível: o texto segue visível para cópia manual.
    }
  }

  return (
    <div className="space-y-3">
      {secoes.map((s) => (
        <section
          key={s.chave}
          className="rounded-lg border border-border bg-card"
          aria-label={s.titulo}
        >
          <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <h3 className="inline-flex items-center gap-2 text-sm font-medium">
              <span className="text-muted-foreground">{s.icone}</span>
              {s.titulo}
            </h3>
            <button
              type="button"
              onClick={() => copiar(s)}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {copiada === s.chave ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copiado
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-3.5 w-3.5" /> Copiar
                </>
              )}
            </button>
          </header>
          <pre className="whitespace-pre-wrap px-4 py-3 font-sans text-sm leading-relaxed text-foreground">
            {s.texto}
          </pre>
        </section>
      ))}
    </div>
  )
}
