'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type Props = {
  sessaoId: string
  questaoIds: string[]
  tempoMinutos: number
}

type EstadoSalvo = {
  idx: number
  respostas: Record<string, string>
  tempos: Record<string, number>
  restanteSec: number
}

const chaveEstado = (sessaoId: string) => `simulado:${sessaoId}`

function lerEstado(sessaoId: string): EstadoSalvo | null {
  try {
    const bruto = window.localStorage.getItem(chaveEstado(sessaoId))
    return bruto ? (JSON.parse(bruto) as EstadoSalvo) : null
  } catch {
    return null
  }
}

function salvarEstado(sessaoId: string, estado: EstadoSalvo): void {
  try {
    window.localStorage.setItem(chaveEstado(sessaoId), JSON.stringify(estado))
  } catch {
    // armazenamento indisponível (aba anônima): segue sem retomada
  }
}

function limparEstado(sessaoId: string): void {
  try {
    window.localStorage.removeItem(chaveEstado(sessaoId))
  } catch {
    // idem
  }
}

/**
 * Modo prova: respostas ficam no cliente (pode trocar até entregar) e são
 * enviadas UMA vez ao finalizar, com o tempo real gasto em cada questão.
 * O progresso é salvo localmente para retomar após recarregar a página.
 */
export function SimuladoRunner({ sessaoId, questaoIds, tempoMinutos }: Props) {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [restanteSec, setRestanteSec] = useState(tempoMinutos * 60)
  const [enviando, setEnviando] = useState(false)
  const tempos = useRef<Record<string, number>>({})
  const inicioQuestao = useRef(Date.now())
  const finalizando = useRef(false)
  const enviadas = useRef<Set<string>>(new Set())

  const idAtual = questaoIds[idx]
  const questao = trpc.questao.detalhe.useQuery(
    { id: idAtual ?? '' },
    { enabled: Boolean(idAtual) },
  )

  const responderM = trpc.questao.responder.useMutation()
  const finalizarM = trpc.sessao.finalizar.useMutation({
    onSuccess: () => {
      limparEstado(sessaoId)
      router.push(`/simulado/${sessaoId}/resultado`)
    },
    onError: () => {
      finalizando.current = false
      setEnviando(false)
      toast.error('Não foi possível finalizar. Tente de novo.')
    },
  })

  // Retoma simulado interrompido
  useEffect(() => {
    const salvo = lerEstado(sessaoId)
    if (!salvo) return
    tempos.current = salvo.tempos
    setRespostas(salvo.respostas)
    setRestanteSec(salvo.restanteSec)
    setIdx(Math.min(salvo.idx, questaoIds.length - 1))
    toast.info('Simulado retomado de onde você parou.')
  }, [sessaoId, questaoIds.length])

  useEffect(() => {
    salvarEstado(sessaoId, { idx, respostas, tempos: tempos.current, restanteSec })
  }, [sessaoId, idx, respostas, restanteSec])

  useEffect(() => {
    if (restanteSec <= 0) {
      void finalizar()
      return
    }
    const t = setTimeout(() => setRestanteSec((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restanteSec])

  function registrarTempoAtual() {
    if (!idAtual) return
    const gasto = Math.floor((Date.now() - inicioQuestao.current) / 1000)
    tempos.current = { ...tempos.current, [idAtual]: (tempos.current[idAtual] ?? 0) + gasto }
    inicioQuestao.current = Date.now()
  }

  function irPara(novoIdx: number) {
    registrarTempoAtual()
    setIdx(novoIdx)
  }

  async function finalizar() {
    if (finalizando.current) return
    finalizando.current = true
    setEnviando(true)
    registrarTempoAtual()
    for (const qid of questaoIds) {
      const letra = respostas[qid]
      if (!letra || enviadas.current.has(qid)) continue
      try {
        await responderM.mutateAsync({
          questaoId: qid,
          alternativaLetra: letra as never,
          tempoSegundos: Math.max(1, tempos.current[qid] ?? 1),
          confianca: 'INCERTO',
          sessaoId,
        })
        enviadas.current.add(qid)
      } catch {
        finalizando.current = false
        setEnviando(false)
        toast.error('Erro ao enviar respostas. Seu progresso está salvo; tente finalizar de novo.')
        return
      }
    }
    finalizarM.mutate({ id: sessaoId })
  }

  const ultima = idx === questaoIds.length - 1

  if (!idAtual) return <div>Sessão inválida.</div>

  const min = Math.floor(restanteSec / 60)
  const seg = restanteSec % 60
  const tempoCritico = restanteSec < 60

  return (
    <div className="container mx-auto max-w-3xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Questão {idx + 1} de {questaoIds.length}
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-mono font-semibold',
            tempoCritico && 'border-rose-500 bg-rose-50 text-rose-700',
          )}
        >
          <Clock className="size-4" />
          {min.toString().padStart(2, '0')}:{seg.toString().padStart(2, '0')}
        </div>
      </div>

      <Progress value={((idx + 1) / questaoIds.length) * 100} />

      {questao.isLoading || !questao.data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs">
            <Badge style={{ background: questao.data.banca.cor ?? '#AB5D21', color: 'white' }}>
              {questao.data.banca.codigo}
            </Badge>
            <span className="text-muted-foreground">{questao.data.ano}</span>
          </div>
          {questao.data.enunciadoVignette && (
            <Card>
              <CardContent className="pt-6">
                <p className="whitespace-pre-line text-sm">{questao.data.enunciadoVignette}</p>
              </CardContent>
            </Card>
          )}
          <p className="font-medium">{questao.data.enunciado}</p>
          <RadioGroup
            value={respostas[idAtual] ?? undefined}
            onValueChange={(v) => setRespostas((r) => ({ ...r, [idAtual]: v }))}
          >
            {questao.data.alternativas.map((a) => (
              <label
                key={a.id}
                htmlFor={a.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:border-primary"
              >
                <RadioGroupItem id={a.id} value={a.letra} className="mt-1" />
                <div className="flex-1 text-sm">
                  <span className="font-semibold mr-2">{a.letra})</span>
                  {a.texto}
                </div>
              </label>
            ))}
          </RadioGroup>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => irPara(Math.max(0, idx - 1))}
              disabled={idx === 0 || enviando}
            >
              Anterior
            </Button>
            <Button
              onClick={() => (ultima ? void finalizar() : irPara(idx + 1))}
              loading={enviando}
            >
              {ultima ? 'Entregar simulado' : 'Próxima'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
