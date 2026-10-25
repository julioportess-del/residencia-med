'use client'

import Link from 'next/link'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { trpc } from '@/lib/trpc/client'

const CATEGORIAS = [
  { id: null, label: 'Todas' },
  { id: 'DISCUSSAO' as const, label: 'Discussão' },
  { id: 'DUVIDA' as const, label: 'Dúvida' },
  { id: 'DICA' as const, label: 'Dica' },
  { id: 'DESABAFO' as const, label: 'Desabafo' },
]

const COR_CATEGORIA: Record<string, string> = {
  DISCUSSAO: 'bg-primary/15 text-primary',
  DUVIDA: 'bg-amber-500/15 text-amber-700',
  DICA: 'bg-emerald-500/15 text-emerald-700',
  DESABAFO: 'bg-rose-500/15 text-rose-700',
}

type Cat = (typeof CATEGORIAS)[number]['id']

export function ComunidadeFeed() {
  const [cat, setCat] = useState<Cat>(null)
  const { data, isLoading } = trpc.comunidade.listar.useQuery(
    cat ? { categoria: cat, limit: 30 } : { limit: 30 },
  )

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-1 overflow-x-auto">
        {CATEGORIAS.map((c) => (
          <button
            key={c.id ?? 'todas'}
            type="button"
            onClick={() => setCat(c.id)}
            className={cn(
              'whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              c.id === cat
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-secondary',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !data || data.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum post por aqui ainda. Que tal começar?
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((p) => (
            <li key={p.id}>
              <Link href={`/comunidade/${p.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold leading-snug">{p.titulo}</h2>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                          COR_CATEGORIA[p.categoria] ?? 'bg-muted',
                        )}
                      >
                        {p.categoria}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.corpo}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        por {p.autor} ·{' '}
                        {formatDistanceToNow(new Date(p.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-3" />
                        {p.totalComentarios}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
