'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, CheckCircle2, Circle, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const TIPO_LABEL: Record<string, string> = {
  TEORIA: 'Teoria',
  QUESTOES: 'Questões',
  REVISAO: 'Revisão',
  SIMULADO: 'Simulado',
}

export function PlanoSemana() {
  const semana = trpc.plano.semanaAtual.useQuery()
  const utils = trpc.useUtils()
  const marcar = trpc.plano.marcarBloco.useMutation({
    onSuccess: () => utils.plano.semanaAtual.invalidate(),
  })

  if (semana.isLoading) return <Skeleton className="h-96 w-full mt-6" />

  if (!semana.data || !semana.data.plano) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            Você ainda não tem um plano de estudo. Complete o onboarding primeiro.
          </p>
          <Button asChild className="mt-4">
            <Link href="/onboarding">Iniciar onboarding</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { plano, blocos } = semana.data
  const concluidos = blocos.filter((b) => b.status === 'CONCLUIDO').length

  const porDia = new Map<number, typeof blocos>()
  for (const b of blocos) {
    porDia.set(b.diaSemana, [...(porDia.get(b.diaSemana) ?? []), b])
  }

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Banca alvo</div>
            <div className="text-xl font-semibold">{plano.bancaAlvo}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Data da prova</div>
            <div className="text-xl font-semibold">
              {format(plano.dataProva, 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Semana</div>
            <div className="text-xl font-semibold">
              {plano.semanaAtual + 1}/{plano.totalSemanas}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Concluído</div>
            <div className="text-xl font-semibold">
              {concluidos}/{blocos.length}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, dia) => {
          const itens = porDia.get(dia) ?? []
          return (
            <Card key={dia} className="min-h-32">
              <CardHeader className="p-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="size-4" /> {DIAS[dia]}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {itens.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Descanso</p>
                ) : (
                  itens.map((b) => {
                    const concluido = b.status === 'CONCLUIDO'
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          marcar.mutate({
                            blocoId: b.id,
                            status: concluido ? 'PENDENTE' : 'CONCLUIDO',
                          })
                        }
                        className="flex w-full items-start gap-2 rounded-md border p-2 text-left text-xs transition-colors hover:border-primary"
                      >
                        {concluido ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                        ) : (
                          <Circle className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <Badge variant="outline" className="text-[10px] mb-1">
                            {TIPO_LABEL[b.tipo]}
                          </Badge>
                          <div className={concluido ? 'line-through opacity-60' : ''}>
                            {b.titulo}
                          </div>
                          <div className="text-muted-foreground mt-0.5">{b.duracaoMin}min</div>
                        </div>
                      </button>
                    )
                  })
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Clique em qualquer bloco para marcar como concluído.{' '}
        <Link href="/questoes" className="inline-flex items-center gap-1 underline">
          Ir ao banco de questões <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  )
}
