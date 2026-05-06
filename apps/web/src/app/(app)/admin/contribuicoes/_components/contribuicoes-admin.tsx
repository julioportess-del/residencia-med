'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { trpc } from '@/lib/trpc/client'

type Status = 'PENDENTE_REVISAO' | 'APROVADA' | 'REJEITADA' | 'REJEITADA_IA'

export function ContribuicoesAdmin() {
  const [status, setStatus] = useState<Status>('PENDENTE_REVISAO')
  return (
    <div className="mt-6">
      <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
        <TabsList>
          <TabsTrigger value="PENDENTE_REVISAO">Pendentes</TabsTrigger>
          <TabsTrigger value="APROVADA">Aprovadas</TabsTrigger>
          <TabsTrigger value="REJEITADA">Rejeitadas</TabsTrigger>
          <TabsTrigger value="REJEITADA_IA">Reprovadas IA</TabsTrigger>
        </TabsList>
        <TabsContent value={status}>
          <ListaSubmissoes status={status} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ListaSubmissoes({ status }: { status: Status }) {
  const fila = trpc.contribuicao.fila.useQuery({ status })
  const [aberta, setAberta] = useState<string | null>(null)

  if (fila.isLoading) return <Skeleton className="h-40" />
  if (!fila.data || fila.data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          Nenhuma submissão neste status.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <ul className="space-y-3">
        {fila.data.map((s) => (
          <li key={s.id}>
            <Card className="cursor-pointer hover:border-primary" onClick={() => setAberta(s.id)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{s.banca.codigo}</Badge>
                      <span>{s.ano}</span>
                      <span>·</span>
                      <span>{s.user.email}</span>
                      {typeof s.scoreIA === 'number' && (
                        <>
                          <span>·</span>
                          <span>Score IA {Math.round(s.scoreIA * 100)}/100</span>
                        </>
                      )}
                    </div>
                    <p className="mt-2 text-sm line-clamp-2">{s.enunciado}</p>
                    {s.motivoIA && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        IA: {s.motivoIA}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(s.createdAt, 'dd/MM HH:mm')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {aberta && <ModalRevisao id={aberta} onClose={() => setAberta(null)} />}
    </>
  )
}

function ModalRevisao({ id, onClose }: { id: string; onClose: () => void }) {
  const detalhe = trpc.contribuicao.detalhe.useQuery({ id })
  const utils = trpc.useUtils()
  const [dificuldade, setDificuldade] = useState<'FACIL' | 'MEDIO' | 'DIFICIL' | 'MUITO_DIFICIL'>(
    'MEDIO',
  )
  const [motivoRejeicao, setMotivoRejeicao] = useState('')

  const aprovar = trpc.contribuicao.aprovar.useMutation({
    onSuccess: async () => {
      toast.success('Submissão aprovada e publicada')
      await utils.contribuicao.fila.invalidate()
      onClose()
    },
    onError: (e) => toast.error(e.message),
  })
  const rejeitar = trpc.contribuicao.rejeitar.useMutation({
    onSuccess: async () => {
      toast.success('Submissão rejeitada')
      await utils.contribuicao.fila.invalidate()
      onClose()
    },
    onError: (e) => toast.error(e.message),
  })

  type AltJson = { letra: string; texto: string; correta?: boolean }
  const alternativas =
    (detalhe.data?.alternativasJson as unknown as AltJson[] | undefined) ?? []

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar submissão</DialogTitle>
        </DialogHeader>
        {detalhe.isLoading || !detalhe.data ? (
          <Skeleton className="h-60" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline">{detalhe.data.banca.codigo}</Badge>
              <span className="text-muted-foreground">{detalhe.data.ano}</span>
              <span className="text-muted-foreground">· {detalhe.data.user.email}</span>
            </div>

            {detalhe.data.enunciadoVignette && (
              <div className="rounded-md border bg-secondary/30 p-3 text-sm whitespace-pre-line">
                {detalhe.data.enunciadoVignette}
              </div>
            )}

            <p className="text-sm font-medium">{detalhe.data.enunciado}</p>

            <ul className="space-y-1.5">
              {alternativas.map((a) => {
                const ehGabarito = a.letra === detalhe.data?.gabaritoLetra
                return (
                  <li
                    key={a.letra}
                    className={
                      ehGabarito
                        ? 'rounded-md border-2 border-emerald-500 bg-emerald-50 p-2 text-sm'
                        : 'rounded-md border p-2 text-sm'
                    }
                  >
                    <span className="font-semibold mr-2">{a.letra})</span>
                    {a.texto}
                  </li>
                )
              })}
            </ul>

            {detalhe.data.motivoIA && (
              <div className="rounded-md border bg-blue-50 p-3 text-xs">
                <strong>Análise da IA</strong>
                {typeof detalhe.data.scoreIA === 'number' && (
                  <span> · Score {Math.round(detalhe.data.scoreIA * 100)}/100</span>
                )}
                <p className="mt-1 whitespace-pre-line">{detalhe.data.motivoIA}</p>
              </div>
            )}

            {detalhe.data.fonteUrl && (
              <p className="text-xs">
                Fonte:{' '}
                <a
                  href={detalhe.data.fonteUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-primary underline break-all"
                >
                  {detalhe.data.fonteUrl}
                </a>
              </p>
            )}

            {detalhe.data.status === 'PENDENTE_REVISAO' && (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label>Dificuldade ao publicar</Label>
                  <Select
                    value={dificuldade}
                    onValueChange={(v) => setDificuldade(v as typeof dificuldade)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FACIL">Fácil</SelectItem>
                      <SelectItem value="MEDIO">Médio</SelectItem>
                      <SelectItem value="DIFICIL">Difícil</SelectItem>
                      <SelectItem value="MUITO_DIFICIL">Muito difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => aprovar.mutate({ id: detalhe.data!.id, dificuldade })}
                  loading={aprovar.isPending}
                  className="w-full"
                >
                  <Check className="size-4" />
                  Aprovar e publicar
                </Button>

                <div className="border-t pt-3">
                  <Label htmlFor="motivo-rej">Motivo da rejeição (opcional)</Label>
                  <Input
                    id="motivo-rej"
                    value={motivoRejeicao}
                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                    placeholder="Ex: Gabarito incorreto, conduta desatualizada..."
                    className="mt-1"
                  />
                  <Button
                    variant="destructive"
                    onClick={() =>
                      rejeitar.mutate({
                        id: detalhe.data!.id,
                        motivo: motivoRejeicao || 'Não atende aos critérios de qualidade',
                      })
                    }
                    loading={rejeitar.isPending}
                    className="mt-2 w-full"
                  >
                    <X className="size-4" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            )}

            {detalhe.data.motivoRejeicao && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <strong>Rejeitada</strong>: {detalhe.data.motivoRejeicao}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
