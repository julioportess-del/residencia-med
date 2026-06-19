'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface DialogProps {
  aberto: boolean
  onFechar: () => void
  titulo?: string
  descricao?: string
  children?: ReactNode
  /** Conteúdo do rodapé (ações). */
  rodape?: ReactNode
  className?: string
}

/** Modal tokenizado: overlay + painel, fecha no Esc/overlay. Sem dependências. */
export function Dialog({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  rodape,
  className,
}: DialogProps) {
  useEffect(() => {
    if (!aberto) return
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onFechar}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'animate-fade-in-up relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl',
          className,
        )}
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onFechar}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {titulo ? <h2 className="pr-8 text-base font-semibold tracking-tight">{titulo}</h2> : null}
        {descricao ? <p className="mt-1 text-sm text-muted-foreground">{descricao}</p> : null}

        {children ? <div className="mt-4">{children}</div> : null}
        {rodape ? <div className="mt-6 flex justify-end gap-2">{rodape}</div> : null}
      </div>
    </div>
  )
}
