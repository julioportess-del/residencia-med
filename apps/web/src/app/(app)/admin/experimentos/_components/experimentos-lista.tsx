'use client'

import { useState } from 'react'
import { Pause, Play, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
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
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { ExperimentoResultados } from './experimento-resultados'

type Variante = { nome: string; peso: number }

export function ExperimentosLista() {
  const lista = trpc.experimentos.listar.useQuery()
  const [criandoAberto, setCriandoAberto] = useState(false)
  const [selecionado, setSelecionado] = useState<string | null>(null)

  const ativar = trpc.experimentos.ativar.useMutation({
    onSuccess: () => {
      toast.success('Experimento ativado')
      lista.refetch()
    },
    onError: (e) => toast.error(e.message),
  })
  const encerrar = trpc.experimentos.encerrar.useMutation({
    onSuccess: () => {
      toast.success('Experimento encerrado')
      lista.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {lista.data?.length ?? 0} experimento{lista.data?.length === 1 ? '' : 's'} configurado
          {lista.data?.length === 1 ? '' : 's'}
        </div>
        <Button onClick={() => setCriandoAberto(true)}>
          <Plus className="size-4" /> Novo experimento
        </Button>
      </div>

      {lista.isLoading ? (
        <Skeleton className="h-40" />
      ) : !lista.data || lista.data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum experimento ainda. Crie o primeiro acima.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {lista.data.map((e) => (
            <Card key={e.id}>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{e.nome}</span>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{e.chave}</code>
                      {e.ativo ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Ativo
                        </span>
                      ) : e.encerradoEm ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Encerrado</span>
                      ) : (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                          Rascunho
                        </span>
                      )}
                    </div>
                    {e.descricao ? (
                      <p className="mt-1 text-sm text-muted-foreground">{e.descricao}</p>
                    ) : null}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {e._count.atribuicoes} atribuições · {e._count.eventos} eventos
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelecionado(selecionado === e.id ? null : e.id)}
                    >
                      {selecionado === e.id ? 'Ocultar' : 'Ver resultados'}
                    </Button>
                    {e.ativo ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => encerrar.mutate({ id: e.id })}
                      >
                        <Pause className="size-4" /> Encerrar
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => ativar.mutate({ id: e.id })}>
                        <Play className="size-4" /> Ativar
                      </Button>
                    )}
                  </div>
                </div>
                {selecionado === e.id ? (
                  <div className="mt-4 border-t pt-4">
                    <ExperimentoResultados id={e.id} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </ul>
      )}

      <DialogCriar
        aberto={criandoAberto}
        onFechar={() => {
          setCriandoAberto(false)
          lista.refetch()
        }}
      />
    </div>
  )
}

function DialogCriar({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const [chave, setChave] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [variantes, setVariantes] = useState<Variante[]>([
    { nome: 'A', peso: 50 },
    { nome: 'B', peso: 50 },
  ])

  const criar = trpc.experimentos.criar.useMutation({
    onSuccess: () => {
      toast.success('Experimento criado (em rascunho)')
      onFechar()
      resetar()
    },
    onError: (e) => toast.error(e.message),
  })

  function resetar() {
    setChave('')
    setNome('')
    setDescricao('')
    setVariantes([
      { nome: 'A', peso: 50 },
      { nome: 'B', peso: 50 },
    ])
  }

  function atualizarVariante(i: number, patch: Partial<Variante>) {
    setVariantes((v) => v.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  }

  function removerVariante(i: number) {
    if (variantes.length <= 2) return
    setVariantes((v) => v.filter((_, idx) => idx !== i))
  }

  function adicionarVariante() {
    if (variantes.length >= 10) return
    setVariantes((v) => [...v, { nome: `V${v.length + 1}`, peso: 0 }])
  }

  function submeter() {
    criar.mutate({
      chave: chave.trim().toLowerCase(),
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      variantes: variantes.map((v) => ({ nome: v.nome.trim(), peso: v.peso })),
    })
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo experimento A/B</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="chave">Chave</Label>
            <Input
              id="chave"
              value={chave}
              onChange={(e) => setChave(e.target.value)}
              placeholder="precos-cta-2026"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Identificador estável. Minúsculas, números e hífens.
            </p>
          </div>
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Teste de CTA na página de preços"
            />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Hipótese e métrica primária"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Variantes</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={adicionarVariante}
                disabled={variantes.length >= 10}
              >
                <Plus className="size-3" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {variantes.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={v.nome}
                    onChange={(e) => atualizarVariante(i, { nome: e.target.value })}
                    className="flex-1"
                    placeholder={`Variante ${i + 1}`}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={v.peso}
                    onChange={(e) => atualizarVariante(i, { peso: Number(e.target.value) || 0 })}
                    className="w-20 tabular-nums"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removerVariante(i)}
                    disabled={variantes.length <= 2}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Os pesos são relativos — não precisam somar 100, mas é boa prática.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={submeter} disabled={criar.isPending || !chave || !nome}>
            Criar (rascunho)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
