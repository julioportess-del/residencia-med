'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { trpc } from '@/lib/trpc/client'

const COR_STATUS: Record<string, string> = {
  ABERTO: 'bg-primary/15 text-primary',
  EM_ANDAMENTO: 'bg-amber-500/15 text-amber-700',
  RESOLVIDO: 'bg-emerald-500/15 text-emerald-700',
  FECHADO: 'bg-muted text-muted-foreground',
}

export function TicketsLista() {
  const { data, isLoading } = trpc.suporte.meus.useQuery()

  if (isLoading) return <Skeleton className="mt-6 h-40" />
  if (!data || data.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Você ainda não abriu nenhum ticket.
      </div>
    )
  }

  return (
    <ul className="mt-6 space-y-3">
      {data.map((t) => (
        <li key={t.id}>
          <Link href={`/suporte/${t.id}`}>
            <Card className="transition-colors hover:border-primary">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold leading-snug">{t.titulo}</h2>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      COR_STATUS[t.status],
                    )}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.corpo}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t.categoria && <span className="mr-2">· {t.categoria} ·</span>}
                    atualizado{' '}
                    {formatDistanceToNow(new Date(t.updatedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="size-3" />
                    {t._count.respostas}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  )
}
