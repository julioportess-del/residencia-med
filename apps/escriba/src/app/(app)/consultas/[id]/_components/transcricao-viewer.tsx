'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Transcrição da consulta com RASTREABILIDADE: ao clicar em "Ver origem"
 * numa seção do prontuário, localiza o trecho da transcrição que melhor
 * corresponde ao achado (similaridade de termos, client-side, sem IA) e o
 * destaca. É correspondência APROXIMADA — apoio à conferência, não prova.
 */

export const EVENTO_LOCALIZAR_TRECHO = 'escriba:localizar-trecho'

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function tokens(s: string): Set<string> {
  return new Set(
    normalizar(s)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 5),
  )
}

/** Divide a transcrição em janelas de ~2 frases para pontuar. */
function janelas(texto: string): string[] {
  const frases = texto.split(/(?<=[.!?])\s+/)
  const resultado: string[] = []
  for (let i = 0; i < frases.length; i += 1) {
    resultado.push(frases.slice(i, i + 2).join(' '))
  }
  return resultado.filter((j) => j.trim().length > 20)
}

export function TranscricaoViewer({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false)
  const [trechoDestacado, setTrechoDestacado] = useState<string | null>(null)
  const preRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function aoLocalizar(e: Event) {
      const alvo = (e as CustomEvent<{ texto: string }>).detail?.texto
      if (!alvo) return
      const alvoTokens = tokens(alvo)
      if (alvoTokens.size === 0) return

      let melhor: { janela: string; pontos: number } | null = null
      for (const j of janelas(texto)) {
        const jt = tokens(j)
        let pontos = 0
        for (const t of alvoTokens) if (jt.has(t)) pontos++
        if (!melhor || pontos > melhor.pontos) melhor = { janela: j, pontos }
      }
      setAberto(true)
      setTrechoDestacado(melhor && melhor.pontos > 0 ? melhor.janela : null)
      setTimeout(() => {
        preRef.current?.querySelector('mark')?.scrollIntoView({ block: 'center' })
        preRef.current?.closest('details')?.scrollIntoView({ block: 'nearest' })
      }, 80)
    }
    window.addEventListener(EVENTO_LOCALIZAR_TRECHO, aoLocalizar)
    return () => window.removeEventListener(EVENTO_LOCALIZAR_TRECHO, aoLocalizar)
  }, [texto])

  const partes =
    trechoDestacado && texto.includes(trechoDestacado) ? texto.split(trechoDestacado) : null

  return (
    <details open={aberto} onToggle={(e) => setAberto((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
        Ver transcrição da consulta ({texto.length.toLocaleString('pt-BR')} caracteres)
      </summary>
      {trechoDestacado ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Trecho destacado por correspondência aproximada de termos — confira o contexto completo.
        </p>
      ) : null}
      <div
        ref={preRef}
        className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground"
      >
        {partes ? (
          <>
            {partes[0]}
            <mark className="rounded bg-primary/25 px-0.5 text-foreground">{trechoDestacado}</mark>
            {partes.slice(1).join(trechoDestacado ?? '')}
          </>
        ) : (
          texto
        )}
      </div>
    </details>
  )
}
