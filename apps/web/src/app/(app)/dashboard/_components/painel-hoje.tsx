'use client'

import Link from 'next/link'
import type { inferRouterOutputs } from '@trpc/server'
import { ArrowRight, BookOpen, CalendarClock, CheckCircle2, Circle, Repeat2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import type { AppRouter } from '@/server/routers/_app'
import { PlanoDoDia } from './plano-do-dia'

type DadosHoje = inferRouterOutputs<AppRouter>['dashboard']['hoje']

const formatoDataCurta = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
})
const formatoDataProva = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
})

function dataCurta(chave: string): string {
  return formatoDataCurta.format(new Date(`${chave}T00:00:00Z`))
}

export function PainelHoje({ dados, loading }: { dados?: DadosHoje; loading: boolean }) {
  if (loading || !dados) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PlanoDoDia
        nome={dados.nome}
        revisoesPendentes={dados.revisoesPendentes}
        errosAbertos={dados.errosAbertos}
        flashcardsVencidos={dados.flashcardsVencidos}
        ineditasBancaAlvo={dados.ineditasBancaAlvo}
        filtrosIneditas={dados.filtrosIneditas}
        bancaAlvo={dados.bancaAlvo}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <ContagemRegressiva dados={dados} />
        <SemanaCard dados={dados} />
      </div>
      <PrimeirosPassos passos={dados.passos} />
    </div>
  )
}

function ContagemRegressiva({ dados }: { dados: DadosHoje }) {
  return (
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardContent className="flex h-full flex-col justify-between gap-5 pt-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
            <CalendarClock className="size-4" />
            {dados.bancaAlvo ? `Prova ${dados.bancaAlvo}` : 'Sua prova'}
          </div>
          {dados.dataProva && dados.diasAteProva !== null ? (
            <>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-bold tabular-nums tracking-tight">
                  {dados.diasAteProva}
                </span>
                <span className="text-lg text-muted-foreground">
                  {dados.diasAteProva === 1 ? 'dia' : 'dias'}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatoDataProva.format(dados.dataProva)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Cadastre a data da prova para acompanhar a contagem regressiva.{' '}
              <Link
                href="/onboarding"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Definir agora
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/questoes">
              <BookOpen className="size-4" />
              Treinar questões
            </Link>
          </Button>
          <Button asChild size="sm" variant={dados.revisoesPendentes > 0 ? 'secondary' : 'outline'}>
            <Link href="/revisao">
              <Repeat2 className="size-4" />
              {dados.revisoesPendentes > 0
                ? `Revisar ${dados.revisoesPendentes} pendente${dados.revisoesPendentes === 1 ? '' : 's'}`
                : 'Revisão em dia'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SemanaCard({ dados }: { dados: DadosHoje }) {
  const { semana, metaDiaria } = dados
  const taxa =
    semana.totalSemana > 0 ? Math.round((semana.acertosSemana / semana.totalSemana) * 100) : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <CardTitle className="text-base">Cumprimento da semana</CardTitle>
            <p className="text-xs text-muted-foreground">
              {dataCurta(semana.inicio)} a {dataCurta(semana.fim)} · meta de {metaDiaria}{' '}
              questões/dia
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">{semana.pctSemana}%</div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {semana.totalSemana}/{semana.metaSemana} questões
              {taxa !== null && ` · ${taxa}% acerto`}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Questões por dia da semana">
          {semana.dias.map((d) => (
            <li
              key={d.data}
              className="flex flex-col items-center gap-1.5"
              title={`${d.rotulo}: ${d.total} questões (${d.pctMeta}% da meta)`}
            >
              <div
                className={cn(
                  'relative flex h-24 w-full items-end overflow-hidden rounded-md bg-secondary',
                  d.ehHoje && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                  d.futuro && 'opacity-50',
                )}
              >
                <div
                  className={cn(
                    'w-full rounded-md transition-[height] duration-500',
                    d.pctMeta >= 100 ? 'bg-emerald-500' : 'bg-primary',
                  )}
                  style={{ height: `${d.pctMeta}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-xs',
                  d.ehHoje ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                {d.rotulo}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground">{d.total}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

function PrimeirosPassos({ passos }: { passos: DadosHoje['passos'] }) {
  const feitos = passos.filter((p) => p.feito).length
  if (feitos === passos.length) return null
  const proximo = passos.find((p) => !p.feito)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Primeiros passos</CardTitle>
          <span className="text-xs tabular-nums text-muted-foreground">
            {feitos} de {passos.length}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${(feitos / passos.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {passos.map((p) => {
            const ehProximo = p.id === proximo?.id
            return (
              <li key={p.id}>
                <Link
                  href={p.href}
                  className={cn(
                    'group flex h-full flex-col gap-1 rounded-lg border p-3 text-sm transition-colors hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    ehProximo && 'border-primary bg-primary/5',
                    p.feito && 'opacity-60',
                  )}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    {p.feito ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className={cn(p.feito && 'line-through')}>{p.titulo}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{p.descricao}</span>
                  {ehProximo && (
                    <span className="mt-auto flex items-center gap-1 pt-1 text-xs font-medium text-primary">
                      Começar{' '}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
