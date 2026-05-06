'use client'

import { useEffect, useState } from 'react'
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

export function SimuladoRunner({ sessaoId, questaoIds, tempoMinutos }: Props) {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [restanteSec, setRestanteSec] = useState(tempoMinutos * 60)
  const [inicioQuestao, setInicioQuestao] = useState(Date.now())

  const idAtual = questaoIds[idx]
  const questao = trpc.questao.detalhe.useQuery(
    { id: idAtual ?? '' },
    { enabled: Boolean(idAtual) },
  )

  const responderM = trpc.questao.responder.useMutation()
  const finalizarM = trpc.sessao.finalizar.useMutation({
    onSuccess: () => router.push(`/simulado/${sessaoId}/resultado`),
  })

  useEffect(() => {
    if (restanteSec <= 0) {
      void finalizar()
      return
    }
    const t = setInterval(() => setRestanteSec((s) => s - 1), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restanteSec])

  useEffect(() => {
    setInicioQuestao(Date.now())
  }, [idx])

  const finalizar = async () => {
    if (finalizarM.isPending) return
    // submete respostas pendentes
    for (const qid of questaoIds) {
      if (!respostas[qid]) continue
      try {
        await responderM.mutateAsync({
          questaoId: qid,
          alternativaLetra: respostas[qid] as never,
          tempoSegundos: 60,
          confianca: 'INCERTO',
          sessaoId,
        })
      } catch {
        // já submetidas serão detectadas duplicadas ou ignoradas
      }
    }
    finalizarM.mutate({ id: sessaoId })
  }

  const proxima = async () => {
    const escolha = idAtual ? respostas[idAtual] : undefined
    if (idAtual && escolha) {
      try {
        await responderM.mutateAsync({
          questaoId: idAtual,
          alternativaLetra: escolha as never,
          tempoSegundos: Math.max(1, Math.floor((Date.now() - inicioQuestao) / 1000)),
          confianca: 'INCERTO',
          sessaoId,
        })
      } catch (e) {
        toast.error('Erro ao salvar resposta')
        return
      }
    }
    if (idx < questaoIds.length - 1) {
      setIdx((i) => i + 1)
    } else {
      finalizarM.mutate({ id: sessaoId })
    }
  }

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
            <Badge style={{ background: questao.data.banca.cor ?? '#1d4ed8', color: 'white' }}>
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
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
            >
              Anterior
            </Button>
            <Button onClick={proxima} loading={responderM.isPending || finalizarM.isPending}>
              {idx === questaoIds.length - 1 ? 'Finalizar' : 'Próxima'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
