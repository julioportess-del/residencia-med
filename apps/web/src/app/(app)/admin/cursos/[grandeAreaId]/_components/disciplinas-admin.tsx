'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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

export function DisciplinasAdmin({ grandeAreaId }: { grandeAreaId: string }) {
  const area = trpc.adminCursos.obterGrandeArea.useQuery({ id: grandeAreaId })
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const lista = trpc.adminCursos.listarDisciplinas.useQuery({ grandeAreaId })

  return (
    <>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            {area.data?.nome ?? 'Carregando…'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Disciplinas desta grande área.
          </p>
        </div>
        <Button onClick={() => setCriando(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova disciplina
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {lista.isLoading ? (
          <Skeleton className="h-32" />
        ) : !lista.data || lista.data.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              Nenhuma disciplina cadastrada ainda.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {lista.data.map((d) => (
              <li key={d.id}>
                <Card>
                  <CardContent className="flex items-center justify-between gap-3 py-4">
                    <Link
                      href={`/admin/cursos/${grandeAreaId}/${d.id}`}
                      className="flex-1 min-w-0 hover:underline"
                    >
                      <div className="font-medium">
                        {d.codigo ? `${d.codigo} · ` : ''}
                        {d.nome}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        /{d.slug} · ordem {d.ordem} · {d.totalAulas} aula
                        {d.totalAulas !== 1 ? 's' : ''}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Editar"
                        onClick={() => setEditando(d.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <RemoverDiscBtn id={d.id} nome={d.nome} grandeAreaId={grandeAreaId} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {criando && (
        <FormDisciplina grandeAreaId={grandeAreaId} onClose={() => setCriando(false)} />
      )}
      {editando && (
        <FormDisciplinaEditar id={editando} onClose={() => setEditando(null)} />
      )}
    </>
  )
}

function RemoverDiscBtn({
  id,
  nome,
  grandeAreaId,
}: {
  id: string
  nome: string
  grandeAreaId: string
}) {
  const utils = trpc.useUtils()
  const remover = trpc.adminCursos.removerDisciplina.useMutation({
    onSuccess: async () => {
      toast.success('Disciplina removida')
      await utils.adminCursos.listarDisciplinas.invalidate({ grandeAreaId })
    },
    onError: (e) => toast.error(e.message),
  })
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Remover"
      onClick={() => {
        if (confirm(`Remover "${nome}" e todas as aulas abaixo?`)) {
          remover.mutate({ id })
        }
      }}
      disabled={remover.isPending}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  )
}

function FormDisciplinaEditar({ id, onClose }: { id: string; onClose: () => void }) {
  const d = trpc.adminCursos.obterDisciplina.useQuery({ id })
  if (d.isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <Skeleton className="h-40" />
        </DialogContent>
      </Dialog>
    )
  }
  if (!d.data) return null
  return (
    <FormDisciplina
      grandeAreaId={d.data.grandeAreaId}
      inicial={{
        id: d.data.id,
        nome: d.data.nome,
        slug: d.data.slug,
        codigo: d.data.codigo ?? '',
        ordem: d.data.ordem,
      }}
      onClose={onClose}
    />
  )
}

type DiscInicial = { id: string; nome: string; slug: string; codigo: string; ordem: number }

function FormDisciplina({
  grandeAreaId,
  inicial,
  onClose,
}: {
  grandeAreaId: string
  inicial?: DiscInicial
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [slug, setSlug] = useState(inicial?.slug ?? '')
  const [codigo, setCodigo] = useState(inicial?.codigo ?? '')
  const [ordem, setOrdem] = useState(inicial?.ordem ?? 0)

  const criar = trpc.adminCursos.criarDisciplina.useMutation({
    onSuccess: async () => {
      toast.success('Disciplina criada')
      await utils.adminCursos.listarDisciplinas.invalidate({ grandeAreaId })
      onClose()
    },
    onError: (e) => toast.error(e.message),
  })
  const editar = trpc.adminCursos.editarDisciplina.useMutation({
    onSuccess: async () => {
      toast.success('Disciplina atualizada')
      await utils.adminCursos.listarDisciplinas.invalidate({ grandeAreaId })
      onClose()
    },
    onError: (e) => toast.error(e.message),
  })

  function submit() {
    if (nome.trim().length < 2) {
      toast.error('Informe um nome')
      return
    }
    if (inicial) {
      editar.mutate({ id: inicial.id, nome, slug: slug || undefined, codigo: codigo || null, ordem })
    } else {
      criar.mutate({
        grandeAreaId,
        nome,
        slug: slug || undefined,
        codigo: codigo || undefined,
        ordem,
      })
    }
  }

  const salvando = criar.isPending || editar.isPending

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{inicial ? 'Editar disciplina' : 'Nova disciplina'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Código (ex: PREV 8)</Label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
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
          <div>
            <Label>Slug (opcional)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
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
