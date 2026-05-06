'use client'

import Link from 'next/link'
import { CheckCircle, RefreshCcw, XCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export function ResultadoSimulado({ sessaoId }: { sessaoId: string }) {
  const sessao = trpc.sessao.detalhe.useQuery({ id: sessaoId })
  const resumo = trpc.sessao.finalizar.useMutation()

  if (sessao.isLoading) return <Skeleton className="h-96 w-full" />
  if (!sessao.data) return <div>Sessao nao encontrada.</div>

  const total = sessao.data.respostas.length
  const acertos = sessao.data.acertos
  const tx = total > 0 ? Math.round((acertos / total) * 100) : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-sm text-muted-foreground">Voce acertou</div>
          <div className="mt-2 text-6xl font-bold tabular-nums">{tx}%</div>
          <div className="mt-1 text-muted-foreground">
            {acertos} de {total} questoes
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhe das questoes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {sessao.data.respostas.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <span className="w-6 text-sm font-mono text-muted-foreground">{i + 1}</span>
                {r.correta ? (
                  <CheckCircle className="size-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="size-5 text-rose-500 shrink-0" />
                )}
                <Link
                  href={`/questoes/${r.questaoId}`}
                  className="flex-1 text-sm hover:underline truncate"
                >
                  {r.questao.enunciado.slice(0, 100)}...
                </Link>
                <span className="text-xs text-muted-foreground">
                  {r.questao.banca.codigo}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/simulado">
            <RefreshCcw className="size-4" />
            Novo simulado
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Voltar ao dashboard</Link>
        </Button>
      </div>
      {/* placeholder */}
      <span className="hidden">{JSON.stringify(resumo.data)}</span>
    </div>
  )
}

void Bar
void BarChart
void CartesianGrid
void ResponsiveContainer
void Tooltip
void XAxis
void YAxis
