'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'
import { trpc } from '@/lib/trpc/client'
import { TicketDetalheAdmin } from './ticket-detalhe-admin'

type Status = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'FECHADO' | 'TODOS'

const COR_STATUS: Record<string, string> = {
  ABERTO: 'bg-primary/15 text-primary',
  EM_ANDAMENTO: 'bg-amber-500/15 text-amber-700',
  RESOLVIDO: 'bg-emerald-500/15 text-emerald-700',
  FECHADO: 'bg-muted text-muted-foreground',
}

export function TicketsAdmin() {
  const [status, setStatus] = useState<Status>('ABERTO')
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [aberto, setAberto] = useState<string | null>(null)

  const contagens = trpc.adminTickets.contagens.useQuery()
  const lista = trpc.adminTickets.listar.useQuery({
    status: status === 'TODOS' ? undefined : status,
    busca: buscaDebounced || undefined,
  })

  function onBuscaChange(valor: string) {
    setBusca(valor)
    // debounce simples
    clearTimeout((window as unknown as { _buscaT?: number })._buscaT)
    ;(window as unknown as { _buscaT: number })._buscaT = window.setTimeout(() => {
      setBuscaDebounced(valor.trim())
    }, 400)
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
          <TabsList>
            <TabsTrigger value="ABERTO">
              Abertos
              {contagens.data && contagens.data.ABERTO > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {contagens.data.ABERTO}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="EM_ANDAMENTO">
              Em andamento
              {contagens.data && contagens.data.EM_ANDAMENTO > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {contagens.data.EM_ANDAMENTO}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="RESOLVIDO">Resolvidos</TabsTrigger>
            <TabsTrigger value="FECHADO">Fechados</TabsTrigger>
            <TabsTrigger value="TODOS">Todos</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar título ou corpo"
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
          />
        </div>
      </div>

      {lista.isLoading ? (
        <Skeleton className="h-40" />
      ) : !lista.data || lista.data.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            Nenhum ticket neste filtro.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {lista.data.map((t) => (
            <li key={t.id}>
              <button type="button" className="w-full text-left" onClick={() => setAberto(t.id)}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t.titulo}</span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                              COR_STATUS[t.status],
                            )}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                          {t.categoria && (
                            <Badge variant="outline" className="text-xs">
                              {t.categoria}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {t.user.name ?? t.user.email}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm">{t.corpo}</p>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        <div>
                          {formatDistanceToNow(new Date(t.updatedAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </div>
                        <div className="mt-1">
                          {t._count.respostas} resposta{t._count.respostas !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}

      {aberto && <TicketDetalheAdmin id={aberto} onClose={() => setAberto(null)} />}
    </div>
  )
}
