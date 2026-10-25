'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export function PostDetalhe({ id }: { id: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.comunidade.obter.useQuery({ id })
  const comentar = trpc.comunidade.comentar.useMutation({
    onSuccess: () => {
      toast.success('Comentário enviado.')
      setTexto('')
      utils.comunidade.obter.invalidate({ id })
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao comentar'),
  })
  const [texto, setTexto] = useState('')

  if (isLoading) return <Skeleton className="mt-4 h-96" />
  if (!data) return null

  const autor = data.user.name ?? data.user.email.split('@')[0] ?? 'anônimo'

  return (
    <>
      <article className="mt-4">
        <div className="mb-2 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
          {data.categoria}
        </div>
        <h1 className="text-2xl font-bold">{data.titulo}</h1>
        <div className="mt-1 text-xs text-muted-foreground">
          por {autor} ·{' '}
          {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true, locale: ptBR })}
        </div>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{data.corpo}</div>
      </article>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Comentários ({data.comentarios.length})
        </h2>
        <div className="mt-3 space-y-3">
          {data.comentarios.map((c) => {
            const nome = c.user.name ?? c.user.email.split('@')[0] ?? 'anônimo'
            return (
              <Card key={c.id}>
                <CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">
                    {nome} ·{' '}
                    {formatDistanceToNow(new Date(c.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm">{c.corpo}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            comentar.mutate({ postId: id, corpo: texto })
          }}
        >
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Comente..."
            className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
            minLength={1}
            maxLength={5000}
          />
          <Button type="submit" loading={comentar.isPending}>
            Comentar
          </Button>
        </form>
      </section>
    </>
  )
}
