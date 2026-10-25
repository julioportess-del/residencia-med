'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FileText, Pencil, Plus, Trash2, Video } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export function AulasAdmin({
  grandeAreaId,
  disciplinaId,
}: {
  grandeAreaId: string
  disciplinaId: string
}) {
  const d = trpc.adminCursos.obterDisciplina.useQuery({ id: disciplinaId })
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const aulas = trpc.adminCursos.listarAulas.useQuery({ disciplinaId })

  return (
    <>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            {d.data ? (
              <>
                {d.data.codigo ? (
                  <span className="text-muted-foreground">{d.data.codigo} · </span>
                ) : null}
                {d.data.nome}
              </>
            ) : (
              'Carregando…'
            )}
          </h1>
          {d.data && <p className="mt-1 text-sm text-muted-foreground">{d.data.grandeArea.nome}</p>}
        </div>
        <Button onClick={() => setCriando(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova aula
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {aulas.isLoading ? (
          <Skeleton className="h-32" />
        ) : !aulas.data || aulas.data.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              Nenhuma aula cadastrada ainda.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {aulas.data.map((a) => (
              <li key={a.id}>
                <Card>
                  <CardContent className="flex items-center justify-between gap-3 py-4">
                    <Link
                      href={`/admin/cursos/${grandeAreaId}/${disciplinaId}/${a.id}`}
                      className="flex-1 min-w-0 hover:underline"
                    >
                      <div className="font-medium">{a.titulo}</div>
                      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>/{a.slug}</span>
                        <span>·</span>
                        <span>ordem {a.ordem}</span>
                        {a.totalVideos > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <Video className="h-3 w-3" /> {a.totalVideos}
                          </Badge>
                        )}
                        {a.totalMateriais > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <FileText className="h-3 w-3" /> {a.totalMateriais}
                          </Badge>
                        )}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Editar"
                        onClick={() => setEditando(a.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <RemoverAulaBtn id={a.id} titulo={a.titulo} disciplinaId={disciplinaId} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {criando && <FormAula disciplinaId={disciplinaId} onClose={() => setCriando(false)} />}
      {editando && <FormAulaEditar id={editando} onClose={() => setEditando(null)} />}
    </>
  )
}

function RemoverAulaBtn({
  id,
  titulo,
  disciplinaId,
}: {
  id: string
  titulo: string
  disciplinaId: string
}) {
  const utils = trpc.useUtils()
  const remover = trpc.adminCursos.removerAula.useMutation({
    onSuccess: async () => {
      toast.success('Aula removida')
      await utils.adminCursos.listarAulas.invalidate({ disciplinaId })
    },
    onError: (e) => toast.error(e.message),
  })
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Remover"
      onClick={() => {
        if (confirm(`Remover "${titulo}"?`)) remover.mutate({ id })
      }}
      disabled={remover.isPending}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  )
}

function FormAulaEditar({ id, onClose }: { id: string; onClose: () => void }) {
  const q = trpc.adminCursos.obterAula.useQuery({ id })
  if (q.isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <Skeleton className="h-40" />
        </DialogContent>
      </Dialog>
    )
  }
  if (!q.data) return null
  return (
    <FormAula
      disciplinaId={q.data.disciplinaId}
      inicial={{
        id: q.data.id,
        titulo: q.data.titulo,
        slug: q.data.slug,
        descricao: q.data.descricao ?? '',
        ordem: q.data.ordem,
      }}
      onClose={onClose}
    />
  )
}

type AulaInicial = {
  id: string
  titulo: string
  slug: string
  descricao: string
  ordem: number
}

function FormAula({
  disciplinaId,
  inicial,
  onClose,
}: {
  disciplinaId: string
  inicial?: AulaInicial
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '')
  const [slug, setSlug] = useState(inicial?.slug ?? '')
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '')
  const [ordem, setOrdem] = useState(inicial?.ordem ?? 0)

  const criar = trpc.adminCursos.criarAula.useMutation({
    onSuccess: async () => {
      toast.success('Aula criada')
      await utils.adminCursos.listarAulas.invalidate({ disciplinaId })
      onClose()
    },
    onError: (e) => toast.error(e.message),
  })
  const editar = trpc.adminCursos.editarAula.useMutation({
    onSuccess: async () => {
      toast.success('Aula atualizada')
      await utils.adminCursos.listarAulas.invalidate({ disciplinaId })
      onClose()
    },
    onError: (e) => toast.error(e.message),
  })

  function submit() {
    if (titulo.trim().length < 2) {
      toast.error('Informe um título')
      return
    }
    if (inicial) {
      editar.mutate({
        id: inicial.id,
        titulo,
        slug: slug || undefined,
        descricao: descricao || null,
        ordem,
      })
    } else {
      criar.mutate({
        disciplinaId,
        titulo,
        slug: slug || undefined,
        descricao: descricao || undefined,
        ordem,
      })
    }
  }

  const salvando = criar.isPending || editar.isPending

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{inicial ? 'Editar aula' : 'Nova aula'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <Label>Descrição</Label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Slug (opcional)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input
                type="number"
                min={0}
                value={ordem}
                onChange={(e) => setOrdem(Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
