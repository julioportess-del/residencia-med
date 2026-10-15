'use client'

import type { inferRouterOutputs } from '@trpc/server'
import { Crosshair } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import type { AppRouter } from '@/server/routers/_app'

type DadosPrioridades = inferRouterOutputs<AppRouter>['dashboard']['prioridades']

const LEGENDA_FONTE: Record<DadosPrioridades['fonteIncidencia'], string> = {
  analise: 'Peso pela incidência histórica da banca.',
  volume: 'Peso pelo volume de questões da banca no nosso banco.',
  nenhuma: 'Sem dados de incidência — todas as áreas com o mesmo peso.',
}

function corTaxa(taxa: number): string {
  if (taxa >= 0.75) return 'bg-emerald-500'
  if (taxa >= 0.55) return 'bg-primary'
  if (taxa >= 0.35) return 'bg-amber-500'
  return 'bg-red-600'
}

export function PrioridadesCard({
  dados,
  loading,
}: {
  dados?: DadosPrioridades
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crosshair className="size-4" />
          Prioridade de estudo
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Onde está o maior ganho: menor acerto × mais cobrado
          {dados?.bancaAlvo ? ` na ${dados.bancaAlvo}` : ''}.
        </p>
      </CardHeader>
      <CardContent>
        {loading || !dados ? (
          <Skeleton className="h-64" />
        ) : dados.itens.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Nenhuma especialidade cadastrada.
          </div>
        ) : (
          <>
            <ol className="space-y-2.5">
              {dados.itens.map((item, i) => (
                <li
                  key={item.id}
                  className={cn(
                    'grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 gap-y-1 rounded-lg p-2',
                    i === 0 && 'bg-primary/5 ring-1 ring-primary/30',
                  )}
                >
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: item.cor ?? 'hsl(var(--muted-foreground))' }}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-medium">{item.nome}</span>
                      {i === 0 && <Badge className="shrink-0 text-[10px]">Comece por aqui</Badge>}
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      {item.taxa !== null && (
                        <div
                          className={cn('h-full rounded-full', corTaxa(item.taxa))}
                          style={{ width: `${Math.round(item.taxa * 100)}%` }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs tabular-nums">
                    {item.taxa === null ? (
                      <span className="text-muted-foreground">não treinada</span>
                    ) : (
                      <>
                        <div className="font-semibold">{Math.round(item.taxa * 100)}%</div>
                        <div className="text-muted-foreground">
                          {item.acertos}/{item.total}
                          {!item.amostraSuficiente && ' · pouca amostra'}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11px] text-muted-foreground">
              {LEGENDA_FONTE[dados.fonteIncidencia]}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
