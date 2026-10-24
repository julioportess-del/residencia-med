'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Activity, Copy, Key, Plus, Trash2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export function ApiKeysShell() {
  const lista = trpc.apiKeys.listar.useQuery()
  const utils = trpc.useUtils()

  const [novaChavePlain, setNovaChavePlain] = useState<string | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const [dialogAberto, setDialogAberto] = useState(false)

  const criar = trpc.apiKeys.criar.useMutation({
    onSuccess: async (k) => {
      setNovaChavePlain(k.chave)
      setDialogAberto(true)
      setNovoNome('')
      await utils.apiKeys.listar.invalidate()
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao criar'),
  })

  const revogar = trpc.apiKeys.revogar.useMutation({
    onSuccess: async () => {
      toast.success('Chave revogada')
      await utils.apiKeys.listar.invalidate()
    },
    onError: (e) => toast.error(e.message ?? 'Erro'),
  })

  return (
    <div className="mt-6 space-y-6">
      <UsoApi />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4" />
            Nova chave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (novoNome.trim().length < 2) {
                toast.error('Dê um nome descritivo (ex: "Integração Cursinho")')
                return
              }
              criar.mutate({ nome: novoNome.trim(), scopes: ['read'] })
            }}
            className="flex flex-wrap gap-2"
          >
            <div className="flex-1 min-w-[240px]">
              <Label htmlFor="nome-chave">Nome</Label>
              <Input
                id="nome-chave"
                placeholder="Ex: Integração com Moodle"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" loading={criar.isPending}>
                Gerar chave
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="size-4" />
            Chaves ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lista.isLoading ? (
            <Skeleton className="h-20" />
          ) : !lista.data || lista.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma chave gerada ainda. Crie uma acima.
            </p>
          ) : (
            <ul className="divide-y">
              {lista.data.map((k) => {
                const ehRevogada = !!k.revogadaEm
                return (
                  <li key={k.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{k.nome}</span>
                        {ehRevogada && <Badge variant="destructive">Revogada</Badge>}
                      </div>
                      <code className="mt-0.5 inline-block text-xs text-muted-foreground">
                        {k.prefixo}…
                      </code>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Criada {format(k.createdAt, 'dd/MM/yyyy')}
                        {k.ultimoUsoEm && ` · Último uso ${format(k.ultimoUsoEm, 'dd/MM HH:mm')}`}
                        {k.expiraEm && ` · Expira ${format(k.expiraEm, 'dd/MM/yyyy')}`}
                        {' · '}
                        {k._count.usos} requisições
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {k.scopes.map((s) => (
                          <Badge key={s} variant="outline">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {!ehRevogada && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Revogar "${k.nome}"? Integrações existentes vão parar.`)) {
                            revogar.mutate({ apiKeyId: k.id })
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sua nova chave de API</DialogTitle>
            <DialogDescription>
              Esta chave aparece apenas uma vez. Copie e guarde em local seguro — depois disso só
              ficará visível o prefixo.
            </DialogDescription>
          </DialogHeader>
          {novaChavePlain && (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted p-3 font-mono text-xs break-all">
                {novaChavePlain}
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(novaChavePlain)
                  toast.success('Chave copiada')
                }}
                className="w-full"
              >
                <Copy className="size-4" />
                Copiar para a área de transferência
              </Button>
              <p className="text-xs text-muted-foreground">
                Use no header HTTP:{' '}
                <code className="rounded bg-muted px-1">
                  Authorization: Bearer {novaChavePlain.slice(0, 12)}…
                </code>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UsoApi() {
  const stats = trpc.apiKeys.estatisticas.useQuery()
  if (stats.isLoading) return <Skeleton className="h-40" />
  if (!stats.data || stats.data.totalChamadas === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4" />
          Uso da API (últimos 7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Total chamadas" valor={stats.data.totalChamadas.toLocaleString()} />
          <Stat
            label="Sucessos (2xx)"
            valor={stats.data.porStatus
              .filter((s) => s.status >= 200 && s.status < 300)
              .reduce((sum, s) => sum + s.total, 0)
              .toLocaleString()}
          />
          <Stat
            label="Erros (4xx/5xx)"
            valor={stats.data.porStatus
              .filter((s) => s.status >= 400)
              .reduce((sum, s) => sum + s.total, 0)
              .toLocaleString()}
          />
        </div>

        {stats.data.porDia.length > 0 && (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.data.porDia}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#AB5D21" name="Chamadas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {stats.data.porRota.length > 0 && (
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
              Top endpoints
            </div>
            <ul className="divide-y">
              {stats.data.porRota.map((r) => (
                <li key={r.rota} className="flex items-center justify-between py-1.5 text-sm">
                  <code className="text-xs">{r.rota}</code>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                    <span>{r.total} chamadas</span>
                    <span>~{r.latenciaMedia}ms</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{valor}</div>
    </div>
  )
}
