'use client'

import Link from 'next/link'
import { Map } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type Especialidade = {
  especialidadeId: string
  nome: string
  score: number // 0-100
  total: number
  acertos: number
  pesoTotal: number
}

type Dados = {
  scoreGlobal: number
  totalRespostas: number
  porEspecialidade: Especialidade[]
}

type Props = {
  dados: Dados | undefined
  loading: boolean
}

/**
 * Classifica o nível de domínio em 4 faixas que viram a cor da célula do mapa.
 * O limiar é a mesma gramática visual do resto do dashboard (vermelho = fraco,
 * âmbar = atenção, verde-claro = ok, verde-escuro = consolidado).
 */
function nivel(score: number, total: number): 'inicial' | 'em_progresso' | 'ok' | 'consolidado' {
  if (total < 5) return 'inicial' // amostra pequena = não dá pra afirmar nada
  if (score < 50) return 'em_progresso'
  if (score < 75) return 'ok'
  return 'consolidado'
}

const CORES: Record<ReturnType<typeof nivel>, { bg: string; label: string }> = {
  inicial: { bg: 'bg-muted', label: 'Pouca amostra' },
  em_progresso: { bg: 'bg-rose-400/70 dark:bg-rose-500/60', label: 'Em progresso' },
  ok: { bg: 'bg-amber-400/70 dark:bg-amber-500/60', label: 'Ok' },
  consolidado: { bg: 'bg-emerald-500/80 dark:bg-emerald-500/70', label: 'Consolidado' },
}

export function MapaClinico({ dados, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="size-4" />
            Mapa Clínico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    )
  }

  const especialidades = dados?.porEspecialidade ?? []

  if (especialidades.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="size-4" />
            Mapa Clínico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sem respostas suficientes ainda — o mapa surge quando você começa a praticar.
          </p>
          <Link
            href="/sessao/nova"
            className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
          >
            Começar uma sessão →
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Ordem: mais respondido primeiro (já vem do backend); seleciona top 24 para caber no grid.
  const visiveis = especialidades.slice(0, 24)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Map className="size-4" />
          Mapa Clínico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-6">
          {visiveis.map((e) => {
            const nivelAtual = nivel(e.score, e.total)
            const cor = CORES[nivelAtual].bg
            return (
              <div
                key={e.especialidadeId}
                className={`group relative aspect-square cursor-help rounded-sm ${cor} transition-opacity hover:opacity-80`}
                title={`${e.nome} · ${e.acertos}/${e.total} (${Math.round(e.score)}%)`}
                aria-label={`${e.nome}, ${e.acertos} de ${e.total} corretas, ${Math.round(e.score)} por cento`}
              >
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow-md group-hover:block">
                  <span className="font-medium">{e.nome}</span>
                  <span className="ml-2 opacity-75">
                    {e.acertos}/{e.total} · {Math.round(e.score)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {(Object.keys(CORES) as Array<ReturnType<typeof nivel>>).map((k) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={`inline-block size-2.5 rounded-sm ${CORES[k].bg}`} />
              <span>{CORES[k].label}</span>
            </div>
          ))}
        </div>

        {especialidades.length > visiveis.length && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Mostrando as {visiveis.length} especialidades mais respondidas de{' '}
            {especialidades.length}.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
