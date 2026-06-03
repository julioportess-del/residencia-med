'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { LogIn, PlusCircle, Radio, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function LiveShell() {
  return (
    <div className="mt-6 space-y-6">
      <EntrarComCodigo />
      <SalasAtivas />
      <CriarSala />
    </div>
  )
}

function EntrarComCodigo() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="size-4" />
          Entrar em uma sala
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const c = codigo.trim().toUpperCase()
            if (c.length !== 6) {
              toast.error('O código tem 6 caracteres')
              return
            }
            router.push(`/live/${c}`)
          }}
          className="flex gap-2"
        >
          <div className="flex-1">
            <Label htmlFor="codigo-live">Código da sala</Label>
            <Input
              id="codigo-live"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="mt-1 font-mono text-center text-lg tracking-widest uppercase"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit">Entrar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function SalasAtivas() {
  const router = useRouter()
  const lista = trpc.simuladoLive.listarOrg.useQuery()

  if (lista.isLoading) return <Skeleton className="h-24" />
  if (!lista.data || lista.data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="size-4 text-rose-500 animate-pulse" />
          Salas ativas da sua organização
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {lista.data.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 py-3 cursor-pointer hover:bg-muted/40 -mx-2 px-2 rounded-md"
              onClick={() => router.push(`/live/${s.codigo}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium truncate">{s.titulo}</span>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.codigo}</code>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {s.banca?.codigo ?? 'Todas as bancas'} · <Users className="inline size-3" />{' '}
                  {s._count.participantes} participantes
                </div>
              </div>
              <Badge
                variant={s.status === 'EM_ANDAMENTO' ? 'default' : 'outline'}
                className={s.status === 'EM_ANDAMENTO' ? 'bg-emerald-500' : ''}
              >
                {s.status === 'EM_ANDAMENTO' ? 'Ao vivo' : 'Aguardando'}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function CriarSala() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const bancas = trpc.banca.listar.useQuery()

  const [titulo, setTitulo] = useState('')
  const [bancaId, setBancaId] = useState<string>('')
  const [n, setN] = useState(20)
  const [tempo, setTempo] = useState(40)

  const criar = trpc.simuladoLive.criar.useMutation({
    onSuccess: async (r) => {
      toast.success(`Sala criada: ${r.codigo}`)
      await utils.simuladoLive.listarOrg.invalidate()
      router.push(`/live/${r.codigo}`)
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao criar'),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="size-4" />
          Criar nova sala (admin de organização)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (titulo.trim().length < 2) return toast.error('Dê um título')
            criar.mutate({
              titulo: titulo.trim(),
              bancaId: bancaId || undefined,
              numeroQuestoes: n,
              tempoMinutos: tempo,
            })
          }}
          className="space-y-3"
        >
          <div>
            <Label htmlFor="titulo-live">Título</Label>
            <Input
              id="titulo-live"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Simulado AMRIGS — Final de semestre"
              className="mt-1"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label>Banca</Label>
              <Select
                value={bancaId || 'todas'}
                onValueChange={(v) => setBancaId(v === 'todas' ? '' : v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {bancas.data?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="n-live">Questões</Label>
              <Input
                id="n-live"
                type="number"
                min={5}
                max={120}
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tempo-live">Tempo (min)</Label>
            <Input
              id="tempo-live"
              type="number"
              min={5}
              max={360}
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <Button type="submit" loading={criar.isPending} className="w-full">
            Criar sala
          </Button>
          <p className="text-xs text-muted-foreground">
            Se a criação falhar com "apenas administradores", complete o setup B2B em{' '}
            <a href="/org" className="underline">
              /org
            </a>
            . Em modo demo, esta operação só funciona com banco real.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

export function FormatoTempo({ segundos }: { segundos: number }) {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return (
    <span className="font-mono text-xs">
      {m}m{s.toString().padStart(2, '0')}s
    </span>
  )
}

export function FormatoData({ data }: { data: Date | null | undefined }) {
  if (!data) return null
  return <span>{format(data, 'dd/MM HH:mm')}</span>
}
