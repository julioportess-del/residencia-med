'use client'

import { FileText, Loader2, X, AlertCircle, Check } from 'lucide-react'
import type { AnexoUI } from './use-anexos-upload'

interface AnexosChipsProps {
  lista: AnexoUI[]
  onRemover: (localId: string) => void
}

/** Mostra os anexos do turno como chips com miniatura/ícone, status e remover. */
export function AnexosChips({ lista, onRemover }: AnexosChipsProps) {
  if (lista.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2 pb-2">
      {lista.map((a) => {
        const ehImagem = a.tipoMime.startsWith('image/') && a.previewUrl
        return (
          <li
            key={a.localId}
            className={`group relative flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${
              a.status === 'erro'
                ? 'border-destructive/40 bg-destructive/5 text-destructive'
                : 'border-border bg-card'
            }`}
            title={a.erro ?? a.nome}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
              {ehImagem ? (
                <img src={a.previewUrl} alt={a.nome} className="h-8 w-8 object-cover" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
            </span>

            <span className="max-w-[10rem] truncate">{a.nome}</span>

            <span className="shrink-0">
              {a.status === 'enviando' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : a.status === 'erro' ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              )}
            </span>

            <button
              type="button"
              aria-label={`Remover ${a.nome}`}
              onClick={() => onRemover(a.localId)}
              className="ml-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
