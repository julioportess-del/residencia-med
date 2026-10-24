'use client'

import Link from 'next/link'
import type { inferRouterOutputs } from '@trpc/server'
import { AlertTriangle, ArrowRight, CalendarDays, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { ETAPAS, formatarDia, textoDias } from '@/lib/minhas-provas'
import type { AppRouter } from '@/server/routers/_app'

type ProximaProva = inferRouterOutputs<AppRouter>['dashboard']['hoje']['proximasProvas'][number]

export function ProximasProvasCard({ provas }: { provas: ProximaProva[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" />
            Próximas provas
          </CardTitle>
          <Link
            href="/provas"
            className="flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Minhas provas <ArrowRight className="size-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {provas.length === 0 ? (
          <Link
            href="/provas"
            className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-4 shrink-0 text-primary" />
            Cadastre os processos seletivos que vai prestar para acompanhar datas, inscrição e
            logística em um só lugar.
          </Link>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {provas.map((p, i) => {
              const pendencia = p.pendencias[0]
              return (
                <li
                  key={p.id}
                  className={cn(
                    'flex flex-col gap-2 rounded-lg border p-3',
                    i === 0 && 'border-primary/50 bg-primary/5',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.instituicao}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.especialidade}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-bold tabular-nums leading-none">
                        {p.diasAteProva}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.diasAteProva === 1 ? 'dia' : 'dias'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {formatarDia(p.dataProva)} · {textoDias(p.diasAteProva)}
                    </span>
                    <Badge variant={ETAPAS[p.etapa].variante}>{ETAPAS[p.etapa].rotulo}</Badge>
                  </div>
                  {pendencia && (
                    <p
                      className={cn(
                        'flex items-center gap-1.5 text-xs',
                        pendencia.urgente
                          ? 'font-medium text-destructive'
                          : 'text-muted-foreground',
                      )}
                    >
                      <AlertTriangle className="size-3.5 shrink-0" />
                      {pendencia.mensagem}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
