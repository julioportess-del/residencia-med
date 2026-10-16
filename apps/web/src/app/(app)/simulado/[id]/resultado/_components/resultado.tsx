'use client'

import Link from 'next/link'
import { CheckCircle, Circle, Clock, RefreshCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

const ROTULO_DIFICULDADE: Record<string, string> = {
  FACIL: 'Fácil',
  MEDIO: 'Médio',
  DIFICIL: 'Difícil',
  MUITO_DIFICIL: 'Muito difícil',
}
const ROTULO_CONFIANCA: Record<string, string> = {
  CONFIANTE: 'Com certeza',
  INCERTO: 'Com dúvida',
  CHUTE: 'No chute',
}

function formatarTempo(seg: number): string {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = seg % 60
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min${String(s).padStart(2, '0')}`
}

function corTaxa(taxa: number): string {
  if (taxa >= 0.75) return 'bg-emerald-500'
  if (taxa >= 0.55) return 'bg-primary'
  if (taxa >= 0.35) return 'bg-amber-500'
  return 'bg-red-600'
}

type Grupo = { chave: string; total: number; acertos: number; taxa: number }

function Barras({
  titulo,
  grupos,
  rotulo,
}: {
  titulo: string
  grupos: Grupo[]
  rotulo?: (k: string) => string
}) {
  if (grupos.length === 0) return null
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {grupos.map((g) => (
            <li key={g.chave}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{rotulo ? rotulo(g.chave) : g.chave}</span>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round(g.taxa * 100)}% · {g.acertos}/{g.total}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn('h-full rounded-full', corTaxa(g.taxa))}
                  style={{ width: `${g.taxa * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function ResultadoSimulado({ sessaoId }: { sessaoId: string }) {
  const res = trpc.sessao.resultado.useQuery({ id: sessaoId })

  if (res.isLoading) return <Skeleton className="h-96 w-full" />
  if (!res.data) return <div>Sessão não encontrada.</div>

  const { analise: a, questoes } = res.data
  const pct = Math.round(a.taxa * 100)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 text-center sm:grid-cols-4">
          <div className="sm:col-span-1">
            <div className="text-sm text-muted-foreground">Acertos</div>
            <div className="mt-1 text-5xl font-bold tabular-nums">{pct}%</div>
            <div className="text-sm text-muted-foreground">
              {a.acertos} de {a.respondidas}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Erros</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">{a.erros}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Em branco</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">{a.emBranco}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Tempo</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">
              {formatarTempo(a.tempoTotalSegundos)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatarTempo(a.tempoMedioSegundos)} por questão
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Barras titulo="Por área" grupos={a.porArea} />
        <Barras
          titulo="Por dificuldade"
          grupos={a.porDificuldade}
          rotulo={(k) => ROTULO_DIFICULDADE[k] ?? k}
        />
        <Barras
          titulo="Por confiança"
          grupos={a.porConfianca}
          rotulo={(k) => ROTULO_CONFIANCA[k] ?? k}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questão a questão</CardTitle>
          <p className="text-xs text-muted-foreground">
            Abra uma questão para ver a correção comentada. Responder de novo conta como nova
            tentativa (não altera este resultado).
          </p>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {questoes.map((q) => (
              <li key={q.questaoId} className="flex items-center gap-3 py-2.5">
                <span className="w-7 font-mono text-sm text-muted-foreground">{q.numero}</span>
                {!q.respondida ? (
                  <Circle
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-label="Em branco"
                  />
                ) : q.correta ? (
                  <CheckCircle className="size-5 shrink-0 text-emerald-500" aria-label="Acertou" />
                ) : (
                  <XCircle className="size-5 shrink-0 text-rose-500" aria-label="Errou" />
                )}
                <Link
                  href={`/questoes/${q.questaoId}`}
                  className="min-w-0 flex-1 truncate text-sm hover:underline"
                >
                  {q.resumo ?? 'Em branco'}
                </Link>
                {q.respondida && (
                  <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">
                    {q.escolha ?? '–'}/{q.gabarito} · <Clock className="inline size-3" />{' '}
                    {formatarTempo(q.tempoSegundos)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/simulado">
            <RefreshCcw className="size-4" /> Novo simulado
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/questoes?sit=ERRADAS">Revisar meus erros</Link>
        </Button>
      </div>
    </div>
  )
}
