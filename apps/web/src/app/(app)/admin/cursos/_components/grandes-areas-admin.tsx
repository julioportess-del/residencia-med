'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { trpc } from '@/lib/trpc/client'

type Fase = 'EXTENSIVO' | 'RETA_FINAL' | 'TODAS'

export function GrandesAreasAdmin() {
  const [fase, setFase] = useState<Fase>('TODAS')
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)

  const q = trpc.adminCursos.listarGrandesAreas.useQuery(fase === 'TODAS' ? undefined : { fase })

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Tabs value={fase} onValueChange={(v) => setFase(v as Fase)}>
          <TabsList>
            <TabsTrigger value="TODAS">Todas</TabsTrigger>
            <TabsTrigger value="EXTENSIVO">Extensivo</TabsTrigger>
            <TabsTrigger value="RETA_FINAL">Reta final</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setCriando(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova grande área
        </Button>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-40" />
      ) : !q.data || q.data.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            Nenhuma grande área cadastrada {fase !== 'TODAS' && 'nessa fase'}.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {q.data.map((a) => (
            <li key={a.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <Link href={`/admin/cursos/${a.id}`} className="flex-1 min-w-0 hover:underline">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.nome}</span>
                      <Badge variant="outline" className="text-xs">
                        {a.fase === 'EXTENSIVO' ? 'Extensivo' : 'Reta final'}
                      </Badge>
                      {a.publicado ? (
                        <Badge className="bg-green-600 hover:bg-green-600 text-xs">Publicado</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /{a.slug} · ordem {a.ordem} · {a.totalDisciplinas} disciplina
                      {a.totalDisciplinas !== 1 ? 's' : ''}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditando(a.id)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <RemoverGrandeAreaBtn id={a.id} nome={a.nome} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {criando && <ModalGrandeArea onClose={() => setCriando(false)} />}
      {editando && <ModalGrandeArea id={editando} onClose={() => setEditando(null)} />}
    </div>
  )
}

function RemoverGrandeAreaBtn({ id, nome }: { id: string; nome: string }) {
  const utils = trpc.useUtils()
  const remover = trpc.adminCursos.removerGrandeArea.useMutation({
    onSuccess: async () => {
      toast.success('Grande área removida')
      await utils.adminCursos.listarGrandesAreas.invalidate()
    },
    onError: (e) => toast.error(e.message),
  })
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Remover"
      onClick={() => {
        if (confirm(`Remover "${nome}" e todo o conteúdo abaixo?`)) {
          remover.mutate({ id })
        }
      }}
      disabled={remover.isPending}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  )
}

function ModalGrandeArea({ id, onClose }: { id?: string; onClose: () => void }) {
  const existente = trpc.adminCursos.obterGrandeArea.useQuery({ id: id ?? '' }, { enabled: !!id })

  if (id && existente.isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <Skeleton className="h-40" />
        </DialogContent>
      </Dialog>
    )
  }

  return <FormGrandeArea inicial={id && existente.data ? existente.data : null} onClose={onClose} />
}

type GAInicial = {
  id: string
  nome: string
  slug: string
  descricao: string | null
  capaUrl: string | null
  corTema: string | null
  fase: 'EXTENSIVO' | 'RETA_FINAL'
  ordem: number
  publicado: boolean
}

function FormGrandeArea({ inicial, onClose }: { inicial: GAInicial | null; onClose: () => void }) {
  const utils = trpc.useUtils()
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [slug, setSlug] = useState(inicial?.slug ?? '')
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '')
  const [capaUrl, setCapaUrl] = useState(inicial?.capaUrl ?? '')
  const [corTema, setCorTema] = useState(inicial?.corTema ?? '')
  const [fase, setFase] = useState<'EXTENSIVO' | 'RETA_FINAL'>(inicial?.fase ?? 'EXTENSIVO')
  const [ordem, setOrdem] = useState(inicial?.ordem ?? 0)
  const [publicado, setPublicado] = useState(inicial?.publicado ?? false)

  const criar = trpc.adminCursos.criarGrandeArea.useMutation({
    onSuccess: async () => {
      toast.success('Grande área criada')
      await utils.adminCursos.listarGrandesAreas.invalidate()
      onClose()
    },
    onError: (e) => toast.error(e.message),
  })
  const editar = trpc.adminCursos.editarGrandeArea.useMutation({
    onSuccess: async () => {
      toast.success('Grande área atualizada')
      await utils.adminCursos.listarGrandesAreas.invalidate()
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
      editar.mutate({
        id: inicial.id,
        nome,
        slug: slug || undefined,
        descricao: descricao || null,
        capaUrl: capaUrl || null,
        corTema: corTema || null,
        fase,
        ordem,
        publicado,
      })
    } else {
      criar.mutate({
        nome,
        slug: slug || undefined,
        descricao: descricao || undefined,
        capaUrl: capaUrl || undefined,
        corTema: corTema || undefined,
        fase,
        ordem,
      })
    }
  }

  const salvando = criar.isPending || editar.isPending

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{inicial ? 'Editar grande área' : 'Nova grande área'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label>Slug (opcional — gerado do nome)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
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
              <Label>Fase</Label>
              <Select value={fase} onValueChange={(v) => setFase(v as 'EXTENSIVO' | 'RETA_FINAL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXTENSIVO">Extensivo</SelectItem>
                  <SelectItem value="RETA_FINAL">Reta final</SelectItem>
                </SelectContent>
              </Select>
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
            <Label>URL da capa (opcional)</Label>
            <Input
              value={capaUrl}
              onChange={(e) => setCapaUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Cor-tema (hex, opcional)</Label>
            <Input
              value={corTema}
              onChange={(e) => setCorTema(e.target.value)}
              placeholder="#a0522d"
            />
          </div>
          {inicial && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publicado}
                onChange={(e) => setPublicado(e.target.checked)}
                className="h-4 w-4"
              />
              Publicado — visível para alunos
            </label>
          )}
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
