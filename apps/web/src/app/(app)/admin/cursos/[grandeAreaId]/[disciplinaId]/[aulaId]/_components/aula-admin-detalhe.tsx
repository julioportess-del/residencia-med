'use client'

import { useState } from 'react'
import { FileText, Plus, Trash2, Video } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { trpc } from '@/lib/trpc/client'

type TipoVideo = 'BASE' | 'APROFUNDADA'
type TipoMaterial = 'MAPA_MENTAL' | 'APOSTILA' | 'RESUMO_ESTRATEGICO' | 'SLIDE_AULA' | 'OUTRO'

const ROTULOS_MATERIAL: Record<TipoMaterial, string> = {
  MAPA_MENTAL: 'Mapa mental',
  APOSTILA: 'Apostila',
  RESUMO_ESTRATEGICO: 'Resumo estratégico',
  SLIDE_AULA: 'Slide da aula',
  OUTRO: 'Outro',
}

export function AulaAdminDetalhe({ aulaId }: { aulaId: string }) {
  const q = trpc.adminCursos.obterAula.useQuery({ id: aulaId })
  const [novoVideo, setNovoVideo] = useState(false)
  const [novoMaterial, setNovoMaterial] = useState(false)

  if (q.isLoading || !q.data) {
    return <Skeleton className="mt-6 h-64" />
  }

  const aula = q.data

  return (
    <div className="mt-2 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{aula.titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {aula.disciplina.grandeArea.nome} ·{' '}
          {aula.disciplina.codigo ? `${aula.disciplina.codigo} · ` : ''}
          {aula.disciplina.nome}
        </p>
        {aula.descricao && <p className="mt-3 text-sm text-foreground/80">{aula.descricao}</p>}
      </header>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-4 w-4" /> Vídeos ({aula.videos.length})
          </CardTitle>
          <Button size="sm" onClick={() => setNovoVideo(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar vídeo
          </Button>
        </CardHeader>
        <CardContent>
          {aula.videos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum vídeo cadastrado. Adicione o Mux Playback ID para publicar.
            </p>
          ) : (
            <ul className="space-y-2">
              {aula.videos.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-3 rounded border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={v.tipo === 'BASE' ? 'default' : 'secondary'}>
                        {v.tipo === 'BASE' ? 'Base' : 'Aprofundada'}
                      </Badge>
                      <span className="font-medium">{v.titulo}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {v.provider} · {v.providerId}
                      {v.duracaoS > 0 && ` · ${formatarDuracao(v.duracaoS)}`}
                      {v.apresentador && ` · ${v.apresentador}`}
                    </p>
                  </div>
                  <RemoverVideoBtn id={v.id} titulo={v.titulo} aulaId={aulaId} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-4 w-4" /> Materiais ({aula.materiais.length})
          </CardTitle>
          <Button size="sm" onClick={() => setNovoMaterial(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar material
          </Button>
        </CardHeader>
        <CardContent>
          {aula.materiais.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum material cadastrado. Suba PDFs/mapas no CDN e cole a URL aqui.
            </p>
          ) : (
            <ul className="space-y-2">
              {aula.materiais.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{ROTULOS_MATERIAL[m.tipo as TipoMaterial]}</Badge>
                      <span className="font-medium">{m.titulo}</span>
                    </div>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-xs text-muted-foreground hover:text-foreground"
                    >
                      {m.url}
                    </a>
                  </div>
                  <RemoverMaterialBtn id={m.id} titulo={m.titulo} aulaId={aulaId} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {novoVideo && <FormVideo aulaId={aulaId} onClose={() => setNovoVideo(false)} />}
      {novoMaterial && <FormMaterial aulaId={aulaId} onClose={() => setNovoMaterial(false)} />}
    </div>
  )
}

function formatarDuracao(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function RemoverVideoBtn({ id, titulo, aulaId }: { id: string; titulo: string; aulaId: string }) {
  const utils = trpc.useUtils()
  const remover = trpc.adminCursos.removerVideo.useMutation({
    onSuccess: async () => {
      toast.success('Vídeo removido')
      await utils.adminCursos.obterAula.invalidate({ id: aulaId })
    },
    onError: (e) => toast.error(e.message),
  })
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Remover vídeo"
      onClick={() => {
        if (confirm(`Remover vídeo "${titulo}"?`)) remover.mutate({ id })
      }}
      disabled={remover.isPending}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  )
}

function RemoverMaterialBtn({
  id,
  titulo,
  aulaId,
}: {
  id: string
  titulo: string
  aulaId: string
}) {
  const utils = trpc.useUtils()
  const remover = trpc.adminCursos.removerMaterial.useMutation({
    onSuccess: async () => {
      toast.success('Material removido')
      await utils.adminCursos.obterAula.invalidate({ id: aulaId })
    },
    onError: (e) => toast.error(e.message),
  })
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Remover material"
      onClick={() => {
        if (confirm(`Remover material "${titulo}"?`)) remover.mutate({ id })
      }}
      disabled={remover.isPending}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  )
}

function FormVideo({ aulaId, onClose }: { aulaId: string; onClose: () => void }) {
  const utils = trpc.useUtils()
  const [tipo, setTipo] = useState<TipoVideo>('BASE')
  const [titulo, setTitulo] = useState('')
  const [providerId, setProviderId] = useState('')
  const [provider, setProvider] = useState('mux')
  const [duracao, setDuracao] = useState(0)
  const [thumbUrl, setThumbUrl] = useState('')
  const [apresentador, setApresentador] = useState('')

  const criar = trpc.adminCursos.adicionarVideo.useMutation({
    onSuccess: async () => {
      toast.success('Vídeo adicionado')
      await utils.adminCursos.obterAula.invalidate({ id: aulaId })
      onClose()
    },
    onError: (e) => toast.error(e.message),
  })

  function submit() {
    if (titulo.trim().length < 2 || providerId.trim().length < 1) {
      toast.error('Preencha título e providerId')
      return
    }
    criar.mutate({
      aulaId,
      tipo,
      titulo,
      provider,
      providerId: providerId.trim(),
      duracaoS: duracao,
      thumbUrl: thumbUrl || undefined,
      apresentador: apresentador || undefined,
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar vídeo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoVideo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASE">Base</SelectItem>
                  <SelectItem value="APROFUNDADA">Aprofundada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mux">Mux</SelectItem>
                  <SelectItem value="cloudflare-stream">Cloudflare Stream</SelectItem>
                  <SelectItem value="self-hosted">Self-hosted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <Label>Playback ID / asset ID / URL</Label>
            <Input
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="Ex: Mux Playback ID — Zm123..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duração (s)</Label>
              <Input
                type="number"
                min={0}
                value={duracao}
                onChange={(e) => setDuracao(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Apresentador (opcional)</Label>
              <Input value={apresentador} onChange={(e) => setApresentador(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Thumb URL (opcional)</Label>
            <Input
              value={thumbUrl}
              onChange={(e) => setThumbUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={criar.isPending}>
            {criar.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FormMaterial({ aulaId, onClose }: { aulaId: string; onClose: () => void }) {
  const utils = trpc.useUtils()
  const [tipo, setTipo] = useState<TipoMaterial>('APOSTILA')
  const [titulo, setTitulo] = useState('')
  const [url, setUrl] = useState('')
  const [tamanho, setTamanho] = useState<string>('')

  const criar = trpc.adminCursos.adicionarMaterial.useMutation({
    onSuccess: async () => {
      toast.success('Material adicionado')
      await utils.adminCursos.obterAula.invalidate({ id: aulaId })
      onClose()
    },
    onError: (e) => toast.error(e.message),
  })

  function submit() {
    if (titulo.trim().length < 2 || url.trim().length < 1) {
      toast.error('Preencha título e URL')
      return
    }
    criar.mutate({
      aulaId,
      tipo,
      titulo,
      url: url.trim(),
      tamanhoBytes: tamanho ? Number(tamanho) : undefined,
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar material</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMaterial)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROTULOS_MATERIAL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <Label>URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://cdn.exemplo.com/arquivo.pdf"
            />
          </div>
          <div>
            <Label>Tamanho em bytes (opcional)</Label>
            <Input
              type="number"
              min={0}
              value={tamanho}
              onChange={(e) => setTamanho(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={criar.isPending}>
            {criar.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
