'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'

export function ExperimentoResultados({ id }: { id: string }) {
  const [evento, setEvento] = useState('conversao')
  const r = trpc.experimentos.resultados.useQuery({ id, eventoConversao: evento })

  if (r.isLoading) return <Skeleton className="h-32" />
  if (!r.data) return null

  const { resumo, eventosDistintos, totalAtribuicoes, totalEventos } = r.data
  const variantes = Object.entries(resumo)
  const taxaMaxima = Math.max(0, ...variantes.map(([, v]) => v.taxaPct))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {totalAtribuicoes} atribuições · {totalEventos} eventos
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Evento de conversão</span>
          <Select value={evento} onValueChange={setEvento}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(eventosDistintos.length > 0 ? eventosDistintos : ['conversao']).map((ev) => (
                <SelectItem key={ev} value={ev}>
                  {ev}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {variantes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sem dados ainda — aguardando primeiras atribuições.
        </p>
      ) : (
        <ul className="space-y-2">
          {variantes
            .sort((a, b) => b[1].taxaPct - a[1].taxaPct)
            .map(([nome, dados], idx) => {
              const ehVencedora = idx === 0 && taxaMaxima > 0
              return (
                <li key={nome} className="space-y-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">
                      {nome}
                      {ehVencedora ? (
                        <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                          líder
                        </span>
                      ) : null}
                    </span>
                    <span className="tabular-nums">
                      {dados.conversoes} / {dados.visitantes} ·{' '}
                      <span className="font-semibold">{dados.taxaPct.toFixed(2)}%</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={ehVencedora ? 'h-full bg-emerald-500' : 'h-full bg-primary/60'}
                      style={{
                        width: `${taxaMaxima > 0 ? (dados.taxaPct / taxaMaxima) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}
