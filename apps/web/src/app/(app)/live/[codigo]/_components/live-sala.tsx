'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Clock, Crown, Play, Trophy, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type Resposta = {
  questaoId: string
  alternativaLetra: 'A' | 'B' | 'C' | 'D' | 'E'
  tempoSegundos: number
}

export function LiveSala({ codigo }: { codigo: string }) {
  const sala = trpc.simuladoLive.porCodigo.useQuery({ codigo })
  const utils = trpc.useUtils()

  const entrar = trpc.simuladoLive.entrar.useMutation({
    onSuccess: async () => {
      await utils.simuladoLive.porCodigo.invalidate({ codigo })
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao entrar'),
  })
  const iniciar = trpc.simuladoLive.iniciar.useMutation({
    onSuccess: async () => {
      await utils.simuladoLive.porCodigo.invalidate({ codigo })
    },
    onError: (e) => toast.error(e.message ?? 'Erro'),
  })

  const [estadoEntrou, setEstadoEntrou] = useState<{
    questaoIds: string[]
    tempoMinutos: number
  } | null>(null)

  if (sala.isLoading) return <Skeleton className="h-96" />
  if (!sala.data) return <p>Sala não encontrada.</p>

  const s = sala.data
  const eCriador = false // exibido sem checagem; quando logado real, /leaderboard traz a flag
  const ehAguardando = s.status === 'AGUARDANDO'
  const ehEmAndamento = s.status === 'EM_ANDAMENTO'
  const ehEncerrado = s.status === 'ENCERRADO'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/live"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
        <Badge
          variant={ehEmAndamento ? 'default' : 'outline'}
          className={ehEmAndamento ? 'bg-emerald-500' : ''}
        >
          {ehAguardando && 'Aguardando início'}
          {ehEmAndamento && '🔴 Ao vivo'}
          {ehEncerrado && 'Encerrado'}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{s.titulo}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Código <code className="bg-muted px-1.5 py-0.5 rounded">{s.codigo}</code> ·{' '}
                {s.numeroQuestoes} questões · {s.tempoMinutos}min
                {s.banca && (
                  <>
                    {' · '}
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ background: s.banca.cor ?? '#1d4ed8' }}
                    >
                      {s.banca.codigo}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Participantes</div>
              <div className="text-2xl font-bold">{s._count.participantes}</div>
            </div>
          </div>

          {ehAguardando && !estadoEntrou && (
            <Button
              size="lg"
              className="mt-6 w-full"
              onClick={() => {
                entrar.mutate(
                  { codigo },
                  {
                    onSuccess: (r) => {
                      setEstadoEntrou({
                        questaoIds: r.questaoIds,
                        tempoMinutos: r.tempoMinutos,
                      })
                    },
                  },
                )
              }}
              loading={entrar.isPending}
            >
              <Users className="size-4" />
              Entrar na sala
            </Button>
          )}

          {ehAguardando && estadoEntrou && (
            <div className="mt-6 rounded-md border bg-blue-50 p-4 text-center text-sm">
              Você entrou. Aguardando o criador iniciar.
            </div>
          )}
        </CardContent>
      </Card>

      {ehEmAndamento && estadoEntrou && (
        <SalaResolver
          codigo={codigo}
          simuladoId={s.id}
          questaoIds={estadoEntrou.questaoIds}
          encerraEm={s.encerraEm}
        />
      )}

      <Leaderboard simuladoLiveId={s.id} mostrarBotaoIniciar={ehAguardando} onIniciar={() => iniciar.mutate({ id: s.id })} />

      {void eCriador}
    </div>
  )
}

function SalaResolver({
  simuladoId,
  questaoIds,
  encerraEm,
}: {
  codigo: string
  simuladoId: string
  questaoIds: string[]
  encerraEm: Date | null
}) {
  const [idx, setIdx] = useState(0)
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [enviado, setEnviado] = useState(false)
  const inicioQuestao = useRef(Date.now())

  const idAtual = questaoIds[idx]
  const q = trpc.questao.detalhe.useQuery({ id: idAtual ?? '' }, { enabled: Boolean(idAtual) })

  const finalizar = trpc.simuladoLive.finalizarParticipante.useMutation({
    onSuccess: () => {
      setEnviado(true)
      toast.success('Respostas enviadas!')
    },
    onError: (e) => toast.error(e.message ?? 'Erro'),
  })

  useEffect(() => {
    inicioQuestao.current = Date.now()
  }, [idx])

  // Auto-finaliza quando tempo acaba
  const restanteSec = encerraEm
    ? Math.max(0, Math.floor((new Date(encerraEm).getTime() - Date.now()) / 1000))
    : 0

  useEffect(() => {
    if (restanteSec > 0 || enviado) return
    if (respostas.length > 0) {
      finalizar.mutate({ simuladoLiveId: simuladoId, respostas })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restanteSec === 0])

  const responder = (alt: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (!idAtual) return
    const tempo = Math.max(1, Math.floor((Date.now() - inicioQuestao.current) / 1000))
    const novaResp: Resposta = {
      questaoId: idAtual,
      alternativaLetra: alt,
      tempoSegundos: tempo,
    }
    const novas = [...respostas.filter((r) => r.questaoId !== idAtual), novaResp]
    setRespostas(novas)
    if (idx < questaoIds.length - 1) {
      setIdx(idx + 1)
    } else {
      finalizar.mutate({ simuladoLiveId: simuladoId, respostas: novas })
    }
  }

  if (enviado) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Trophy className="mx-auto size-10 text-amber-500" />
          <h2 className="mt-3 text-xl font-bold">Respostas enviadas</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Acompanhe sua posição no ranking abaixo enquanto outros participantes terminam.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (q.isLoading || !q.data) return <Skeleton className="h-96" />

  const escolha = respostas.find((r) => r.questaoId === idAtual)?.alternativaLetra

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Questão {idx + 1} de {questaoIds.length}
          </span>
          <Cronometro restanteSec={restanteSec} />
        </div>
        <Progress value={((idx + 1) / questaoIds.length) * 100} />

        {q.data.enunciadoVignette && (
          <div className="rounded-md border bg-secondary/30 p-3 text-sm whitespace-pre-line">
            {q.data.enunciadoVignette}
          </div>
        )}
        <p className="font-medium">{q.data.enunciado}</p>

        <div className="space-y-2">
          {q.data.alternativas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => responder(a.letra as 'A' | 'B' | 'C' | 'D' | 'E')}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors hover:border-primary',
                escolha === a.letra && 'border-primary bg-primary/5',
              )}
            >
              <span className="font-bold w-5">{a.letra}</span>
              <span className="flex-1">{a.texto}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            disabled={idx === 0}
            onClick={() => setIdx(Math.max(0, idx - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setIdx(Math.min(questaoIds.length - 1, idx + 1))}
            disabled={idx === questaoIds.length - 1}
          >
            Próxima (sem responder)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Cronometro({ restanteSec }: { restanteSec: number }) {
  const [tick, setTick] = useState(restanteSec)
  useEffect(() => {
    setTick(restanteSec)
    const t = setInterval(() => setTick((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [restanteSec])
  const m = Math.floor(tick / 60)
  const s = tick % 60
  const critico = tick < 60
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-sm font-bold',
        critico && 'border-rose-500 bg-rose-50 text-rose-700',
      )}
    >
      <Clock className="size-3.5" />
      {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
    </div>
  )
}

function Leaderboard({
  simuladoLiveId,
  mostrarBotaoIniciar,
  onIniciar,
}: {
  simuladoLiveId: string
  mostrarBotaoIniciar: boolean
  onIniciar: () => void
}) {
  const lb = trpc.simuladoLive.leaderboard.useQuery(
    { simuladoLiveId },
    {
      refetchInterval: 5000, // polling a cada 5s
      refetchOnWindowFocus: true,
    },
  )
  const ranking = useMemo(() => lb.data?.ranking ?? [], [lb.data?.ranking])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="size-4" />
            Leaderboard ao vivo
          </span>
          {mostrarBotaoIniciar && lb.data?.eCriador && (
            <Button size="sm" onClick={onIniciar}>
              <Play className="size-3.5" />
              Iniciar simulado
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Ninguém entrou ainda. Compartilhe o código.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {ranking.map((p) => (
              <li
                key={p.userId}
                className={cn(
                  'flex items-center gap-3 rounded-md border p-3 text-sm',
                  p.ehVoce && 'border-primary bg-primary/5',
                )}
              >
                <div
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full font-bold text-xs',
                    p.posicao === 1 && 'bg-amber-400 text-white',
                    p.posicao === 2 && 'bg-slate-300 text-slate-900',
                    p.posicao === 3 && 'bg-orange-400 text-white',
                    p.posicao > 3 && 'bg-muted',
                  )}
                >
                  {p.posicao === 1 ? <Crown className="size-3.5" /> : p.posicao}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {p.nome} {p.ehVoce && '(você)'}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold tabular-nums">
                    {p.acertos}/{p.acertos + p.erros}
                  </div>
                  <div className="text-muted-foreground">
                    {Math.floor(p.tempoTotal / 60)}m{(p.tempoTotal % 60).toString().padStart(2, '0')}s
                  </div>
                </div>
                {p.finalizado && <Badge variant="outline">finalizou</Badge>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
