'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { trpc } from '@/lib/trpc/client'

type Status = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'FECHADO'

const COR_STATUS: Record<string, string> = {
  ABERTO: 'bg-primary/15 text-primary',
  EM_ANDAMENTO: 'bg-amber-500/15 text-amber-700',
  RESOLVIDO: 'bg-emerald-500/15 text-emerald-700',
  FECHADO: 'bg-muted text-muted-foreground',
}

export function TicketDetalheAdmin({ id, onClose }: { id: string; onClose: () => void }) {
  const utils = trpc.useUtils()
  const q = trpc.adminTickets.obter.useQuery({ id })
  const [corpo, setCorpo] = useState('')
  const [novoStatus, setNovoStatus] = useState<Status | 'MANTER'>('MANTER')

  const responder = trpc.adminTickets.responder.useMutation({
    onSuccess: async () => {
      toast.success('Resposta enviada')
      setCorpo('')
      setNovoStatus('MANTER')
      await Promise.all([
        utils.adminTickets.obter.invalidate({ id }),
        utils.adminTickets.listar.invalidate(),
        utils.adminTickets.contagens.invalidate(),
      ])
    },
    onError: (e) => toast.error(e.message),
  })

  const alterarStatus = trpc.adminTickets.alterarStatus.useMutation({
    onSuccess: async () => {
      toast.success('Status atualizado')
      await Promise.all([
        utils.adminTickets.obter.invalidate({ id }),
        utils.adminTickets.listar.invalidate(),
        utils.adminTickets.contagens.invalidate(),
      ])
    },
    onError: (e) => toast.error(e.message),
  })

  function submit() {
    if (corpo.trim().length < 1) {
      toast.error('Escreva uma resposta')
      return
    }
    responder.mutate({
      ticketId: id,
      corpo,
      novoStatus: novoStatus === 'MANTER' ? undefined : novoStatus,
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {q.isLoading || !q.data ? (
          <Skeleton className="h-96" />
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3">
                <DialogTitle className="pr-6">{q.data.titulo}</DialogTitle>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    COR_STATUS[q.data.status],
                  )}
                >
                  {q.data.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{q.data.user.name ?? q.data.user.email}</span>
                {q.data.categoria && (
                  <>
                    <span>·</span>
                    <Badge variant="outline">{q.data.categoria}</Badge>
                  </>
                )}
                <span>·</span>
                <span>
                  aberto{' '}
                  {formatDistanceToNow(new Date(q.data.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </DialogHeader>

            <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
              {q.data.corpo}
            </div>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conversa ({q.data.respostas.length})
              </h3>
              {q.data.respostas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem respostas ainda.</p>
              ) : (
                <div className="space-y-2">
                  {q.data.respostas.map((r) => {
                    const nome = r.deEquipe
                      ? 'Equipe'
                      : (r.user.name ?? r.user.email.split('@')[0] ?? 'usuário')
                    return (
                      <Card
                        key={r.id}
                        className={cn(r.deEquipe && 'border-primary/40 bg-primary/5')}
                      >
                        <CardContent className="pt-3 pb-3">
                          <div className="text-xs text-muted-foreground">
                            <span className={cn(r.deEquipe && 'font-semibold text-primary')}>
                              {nome}
                            </span>{' '}
                            ·{' '}
                            {formatDistanceToNow(new Date(r.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </div>
                          <div className="mt-1 whitespace-pre-wrap text-sm">{r.corpo}</div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="space-y-3 border-t pt-4">
              <textarea
                value={corpo}
                onChange={(e) => setCorpo(e.target.value)}
                placeholder="Responder como equipe…"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                maxLength={5000}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Mudar status para</span>
                  <Select
                    value={novoStatus}
                    onValueChange={(v) => setNovoStatus(v as Status | 'MANTER')}
                  >
                    <SelectTrigger className="h-9 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANTER">Manter (auto)</SelectItem>
                      <SelectItem value="ABERTO">Aberto</SelectItem>
                      <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                      <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                      <SelectItem value="FECHADO">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={alterarStatus.isPending || q.data.status === 'FECHADO'}
                    onClick={() => alterarStatus.mutate({ id, status: 'FECHADO' })}
                  >
                    Fechar sem resposta
                  </Button>
                  <Button onClick={submit} disabled={responder.isPending}>
                    {responder.isPending ? 'Enviando…' : 'Enviar resposta'}
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
