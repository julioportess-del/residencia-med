'use client'

import {
  Activity,
  Flame,
  Layers,
  ListChecks,
  Target,
  Trophy,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { trpc } from '@/lib/trpc/client'

export function IndicadoresCliente() {
  const resumo = trpc.dashboard.resumo.useQuery()
  const porEsp = trpc.dashboard.porEspecialidade.useQuery()

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Totais
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icone={<ListChecks className="size-4" />}
            label="Total de Respostas"
            valor={resumo.data?.totalRespostas ?? '—'}
            sub={
              resumo.data
                ? `Média de ${Math.round(resumo.data.totalRespostas / 30)} /dia (30d)`
                : undefined
            }
            loading={resumo.isLoading}
          />
          <KpiCard
            icone={<Target className="size-4" />}
            label="Taxa de acerto"
            valor={resumo.data ? `${Math.round(resumo.data.taxaAcerto * 100)}%` : '—'}
            sub={
              resumo.data
                ? `${resumo.data.totalAcertos} corretas de ${resumo.data.totalRespostas}`
                : undefined
            }
            loading={resumo.isLoading}
          />
          <KpiCard
            icone={<Activity className="size-4" />}
            label="Sessões (30 dias)"
            valor={resumo.data?.sessoes30d ?? '—'}
            loading={resumo.isLoading}
          />
          <KpiCard
            icone={<Flame className="size-4" />}
            label="Sequência"
            valor={
              resumo.data
                ? `${resumo.data.streak} ${resumo.data.streak === 1 ? 'dia' : 'dias'}`
                : '—'
            }
            loading={resumo.isLoading}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Desempenho por assunto
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {porEsp.isLoading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : porEsp.data && porEsp.data.length > 0 ? (
            <>
              <MelhorMenorCard tipo="melhor" lista={porEsp.data} />
              <MelhorMenorCard tipo="menor" lista={porEsp.data} />
            </>
          ) : (
            <Card className="lg:col-span-2 border-dashed">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Responda mais questões para desbloquear a análise por assunto.
              </CardContent>
            </Card>
          )}
        </div>

        {porEsp.data && porEsp.data.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Ranking por volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {porEsp.data.slice(0, 15).map((e) => (
                  <li key={e.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{e.nome}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {Math.round(e.taxa * 100)}% · {e.acertos}/{e.total}
                      </span>
                    </div>
                    <Progress value={Math.round(e.taxa * 100)} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Prática na última semana
        </h2>
        <Card>
          <CardContent className="pt-6">
            {resumo.isLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="flex items-end gap-1.5">
                {resumo.data?.ultimos7.map((d) => {
                  const altura = Math.min(100, (d.total / 30) * 100)
                  return (
                    <div
                      key={d.dia}
                      className="group flex flex-1 flex-col items-center gap-1"
                      title={`${d.dia}: ${d.total} respostas, ${d.acertos} corretas`}
                    >
                      <div
                        className={cn(
                          'w-full rounded-sm bg-primary/70 transition-all group-hover:bg-primary',
                        )}
                        style={{ height: `${Math.max(4, altura)}px` }}
                      />
                      <span className="text-[10px] text-muted-foreground">{d.dia.slice(8)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function KpiCard({
  icone,
  label,
  valor,
  sub,
  loading,
}: {
  icone: React.ReactNode
  label: string
  valor: string | number
  sub?: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icone}
          {label}
        </div>
        <div className="mt-2 text-3xl font-bold">
          {loading ? <Skeleton className="h-8 w-20" /> : valor}
        </div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}

function MelhorMenorCard({
  tipo,
  lista,
}: {
  tipo: 'melhor' | 'menor'
  lista: Array<{ nome: string; taxa: number; total: number; acertos: number }>
}) {
  const comVolume = lista.filter((e) => e.total >= 5)
  if (comVolume.length === 0) return null
  const ordenado = [...comVolume].sort((a, b) =>
    tipo === 'melhor' ? b.taxa - a.taxa : a.taxa - b.taxa,
  )
  const top = ordenado[0]!
  const Icone = tipo === 'melhor' ? TrendingUp : TrendingDown
  const cor = tipo === 'melhor' ? 'text-emerald-600' : 'text-rose-600'
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {tipo === 'melhor' ? <Trophy className="size-4" /> : <Icone className="size-4" />}
          {tipo === 'melhor' ? 'Melhor desempenho' : 'Menor desempenho'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', cor)}>{Math.round(top.taxa * 100)}%</div>
        <div className="mt-1 text-sm font-medium">{top.nome}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {top.acertos} corretas de {top.total} <Layers className="inline size-3" />
        </div>
      </CardContent>
    </Card>
  )
}
