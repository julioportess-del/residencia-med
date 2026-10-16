'use client'

import { AlertTriangle, CircleHelp, Repeat2, Sparkles, XCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type FiltrosLista = { situacao: string; bancaIds?: string[] }

const ICONE: Record<string, React.ReactNode> = {
  'ineditas-alvo': <Sparkles className="size-4" />,
  'revisao-vencida': <Repeat2 className="size-4" />,
  'meus-erros': <XCircle className="size-4" />,
  'certeza-errada': <AlertTriangle className="size-4" />,
  chutes: <CircleHelp className="size-4" />,
}

export function ListasInteligentes({ onEscolher }: { onEscolher: (f: FiltrosLista) => void }) {
  const listas = trpc.questao.listasInteligentes.useQuery()

  if (listas.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }
  if (!listas.data) return null

  return (
    <section aria-label="Listas inteligentes">
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Listas inteligentes</h2>
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {listas.data.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => onEscolher(l.filtros)}
              disabled={l.total === 0}
              title={l.descricao}
              className={cn(
                'flex h-full w-full flex-col gap-1 rounded-lg border bg-card p-3 text-left transition-colors',
                'hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-card',
                l.id === 'certeza-errada' && l.total > 0 && 'border-amber-400',
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {ICONE[l.id]}
                {l.titulo}
              </span>
              <span className="text-2xl font-bold tabular-nums">{l.total}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
