'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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

export function TicketDetalhe({ id }: { id: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.suporte.obter.useQuery({ id })
  const responder = trpc.suporte.responder.useMutation({
    onSuccess: () => {
      toast.success('Resposta enviada.')
      setTexto('')
      utils.suporte.obter.invalidate({ id })
      utils.suporte.meus.invalidate()
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao responder'),
  })
  const [texto, setTexto] = useState('')

  if (isLoading) return <Skeleton className="mt-4 h-96" />
  if (!data) return null
  const fechado = data.status === 'FECHADO' || data.status === 'RESOLVIDO'

  return (
    <>
      <article className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{data.titulo}</h1>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              COR_STATUS[data.status],
            )}
          >
            {data.status.replace('_', ' ')}
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {data.categoria && <span className="mr-2">{data.categoria} ·</span>}
          aberto {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true, locale: ptBR })}
        </div>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{data.corpo}</div>
      </article>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Conversa ({data.respostas.length})
        </h2>
        <div className="mt-3 space-y-3">
          {data.respostas.map((r) => {
            const nome = r.deEquipe
              ? 'Equipe Residência Med'
              : (r.user.name ?? r.user.email.split('@')[0] ?? 'você')
            return (
              <Card key={r.id} className={cn(r.deEquipe && 'border-primary/40 bg-primary/5')}>
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">
                    <span className={cn(r.deEquipe && 'font-semibold text-primary')}>{nome}</span> ·{' '}
                    {formatDistanceToNow(new Date(r.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm">{r.corpo}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {!fechado && (
          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              responder.mutate({ ticketId: id, corpo: texto })
            }}
          >
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escreva uma resposta..."
              className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              required
              minLength={1}
              maxLength={5000}
            />
            <Button type="submit" loading={responder.isPending}>
              Enviar
            </Button>
          </form>
        )}
        {fechado && (
          <p className="mt-6 text-xs text-muted-foreground">
            Este ticket está {data.status.toLowerCase()} — não aceita mais respostas.
          </p>
        )}
      </section>
    </>
  )
}
