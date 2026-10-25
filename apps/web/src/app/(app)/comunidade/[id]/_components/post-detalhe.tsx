'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { BotaoDenunciar } from '../../_components/botao-denunciar'

type Categoria = 'DISCUSSAO' | 'DUVIDA' | 'DICA' | 'DESABAFO'

export function PostDetalhe({ id }: { id: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.comunidade.obter.useQuery({ id })

  const comentar = trpc.comunidade.comentar.useMutation({
    onSuccess: () => {
      toast.success('Comentário enviado.')
      setTextoNovo('')
      utils.comunidade.obter.invalidate({ id })
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao comentar'),
  })

  const editarPost = trpc.comunidade.editarPost.useMutation({
    onSuccess: () => {
      toast.success('Post atualizado.')
      setEditandoPost(false)
      utils.comunidade.obter.invalidate({ id })
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao editar'),
  })

  const editarComentario = trpc.comunidade.editarComentario.useMutation({
    onSuccess: () => {
      toast.success('Comentário atualizado.')
      setComentarioEditando(null)
      utils.comunidade.obter.invalidate({ id })
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao editar'),
  })

  const [textoNovo, setTextoNovo] = useState('')
  const [editandoPost, setEditandoPost] = useState(false)
  const [tituloEdit, setTituloEdit] = useState('')
  const [corpoEdit, setCorpoEdit] = useState('')
  const [categoriaEdit, setCategoriaEdit] = useState<Categoria>('DISCUSSAO')
  const [comentarioEditando, setComentarioEditando] = useState<string | null>(null)
  const [corpoComentarioEdit, setCorpoComentarioEdit] = useState('')

  if (isLoading) return <Skeleton className="mt-4 h-96" />
  if (!data) return null

  const autor = data.user.name ?? data.user.email.split('@')[0] ?? 'anônimo'

  const abrirEdicaoPost = () => {
    setTituloEdit(data.titulo)
    setCorpoEdit(data.corpo)
    setCategoriaEdit(data.categoria as Categoria)
    setEditandoPost(true)
  }

  const abrirEdicaoComentario = (comentarioId: string, corpo: string) => {
    setCorpoComentarioEdit(corpo)
    setComentarioEditando(comentarioId)
  }

  return (
    <>
      <article className="mt-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            {data.categoria}
          </div>
          {data.foiEditado && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              editado
            </span>
          )}
        </div>

        {editandoPost ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              editarPost.mutate({
                id: data.id,
                titulo: tituloEdit,
                corpo: corpoEdit,
                categoria: categoriaEdit,
              })
            }}
          >
            <select
              value={categoriaEdit}
              onChange={(e) => setCategoriaEdit(e.target.value as Categoria)}
              className="rounded-md border bg-background px-2 py-1 text-xs"
            >
              <option value="DISCUSSAO">Discussão</option>
              <option value="DUVIDA">Dúvida</option>
              <option value="DICA">Dica</option>
              <option value="DESABAFO">Desabafo</option>
            </select>
            <input
              value={tituloEdit}
              onChange={(e) => setTituloEdit(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-xl font-bold"
              minLength={3}
              maxLength={200}
              required
            />
            <textarea
              value={corpoEdit}
              onChange={(e) => setCorpoEdit(e.target.value)}
              className="min-h-[160px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              minLength={10}
              maxLength={10_000}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" loading={editarPost.isPending}>
                Salvar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditandoPost(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{data.titulo}</h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                por {autor} ·{' '}
                {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
              {data.souAutor && (
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={abrirEdicaoPost}
                >
                  editar
                </button>
              )}
              {!data.souAutor && <BotaoDenunciar postId={data.id} />}
            </div>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{data.corpo}</div>
          </>
        )}
      </article>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Comentários ({data.comentarios.length})
        </h2>
        <div className="mt-3 space-y-3">
          {data.comentarios.map((c) => {
            const nome = c.user.name ?? c.user.email.split('@')[0] ?? 'anônimo'
            const estaEditando = comentarioEditando === c.id
            return (
              <Card key={c.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {nome} ·{' '}
                      {formatDistanceToNow(new Date(c.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    {c.foiEditado && (
                      <span className="text-[10px] uppercase tracking-wide">editado</span>
                    )}
                    {c.souAutor && !estaEditando && (
                      <button
                        type="button"
                        className="underline hover:text-foreground"
                        onClick={() => abrirEdicaoComentario(c.id, c.corpo)}
                      >
                        editar
                      </button>
                    )}
                    {!c.souAutor && <BotaoDenunciar comentarioId={c.id} />}
                  </div>
                  {estaEditando ? (
                    <form
                      className="mt-2 space-y-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        editarComentario.mutate({ id: c.id, corpo: corpoComentarioEdit })
                      }}
                    >
                      <textarea
                        value={corpoComentarioEdit}
                        onChange={(e) => setCorpoComentarioEdit(e.target.value)}
                        className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                        minLength={1}
                        maxLength={5000}
                        required
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" loading={editarComentario.isPending}>
                          Salvar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setComentarioEditando(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-2 whitespace-pre-wrap text-sm">{c.corpo}</div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            comentar.mutate({ postId: id, corpo: textoNovo })
          }}
        >
          <textarea
            value={textoNovo}
            onChange={(e) => setTextoNovo(e.target.value)}
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
