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
  Stethoscope,
} from 'lucide-react'
import type { EstruturaClinica } from '@residencia-med/ai/clinico'
import { montarSecoesTexto, type SecaoTexto } from '@/lib/secoes'

/**
 * Visão do prontuário em áreas copiáveis individualmente (Resumo,
 * Prescrições, Exames, Orientações, Pendências), derivadas da estrutura
 * clínica já persistida — nenhuma chamada extra de IA. Seções vazias
 * não aparecem.
 */

interface Secao {
  chave: SecaoTexto['chave']
  titulo: string
  icone: React.ReactNode
  texto: string
}

const ICONES: Record<SecaoTexto['chave'], React.ReactNode> = {
  resumo: <MessageSquareText className="h-4 w-4" />,
  exameFisico: <Stethoscope className="h-4 w-4" />,
  prescricoes: <Pill className="h-4 w-4" />,
  exames: <FlaskConical className="h-4 w-4" />,
  orientacoes: <ClipboardList className="h-4 w-4" />,
  pendencias: <AlarmClock className="h-4 w-4" />,
}

export function montarSecoes(e: EstruturaClinica): Secao[] {
  return montarSecoesTexto(e).map((s) => ({ ...s, icone: ICONES[s.chave] }))
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
