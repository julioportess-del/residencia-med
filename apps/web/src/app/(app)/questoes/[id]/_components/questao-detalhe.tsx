'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { CorrecaoPainel } from './correcao-painel'
import { cn } from '@/lib/cn'

type Confianca = 'CHUTE' | 'INCERTO' | 'CONFIANTE' | 'NAO_SEI'

const OPCOES_CONFIANCA: ReadonlyArray<{ v: Confianca; label: string }> = [
  { v: 'CONFIANTE', label: 'Tenho certeza' },
  { v: 'INCERTO', label: 'Estou em dúvida' },
  { v: 'CHUTE', label: 'Chutei' },
  { v: 'NAO_SEI', label: 'Não sei responder' },
]
type Letra = 'A' | 'B' | 'C' | 'D' | 'E'

type Props = {
  id: string
  sessaoId?: string
  /** Em sessão de estudo: avança na sequência da sessão em vez do "próxima" global. */
  onProxima?: () => void
  progresso?: { atual: number; total: number }
}

export function QuestaoDetalhe({ id, sessaoId, onProxima, progresso }: Props) {
  const router = useRouter()
  const questao = trpc.questao.detalhe.useQuery({ id })
  const [escolha, setEscolha] = useState<string | null>(null)
  const [confianca, setConfianca] = useState<Confianca>('INCERTO')
  const [inicio, setInicio] = useState(() => Date.now())
  const [tempoSegundos, setTempoSegundos] = useState(0)

  useEffect(() => {
    setEscolha(null)
    setConfianca('INCERTO')
    setInicio(Date.now())
    setTempoSegundos(0)
  }, [id])

  useEffect(() => {
    const t = setInterval(() => setTempoSegundos(Math.floor((Date.now() - inicio) / 1000)), 1000)
    return () => clearInterval(t)
  }, [inicio])

  const responder = trpc.questao.responder.useMutation({
    onError: (e) => toast.error(e.message ?? 'Erro ao registrar resposta'),
  })

  const proximaQ = trpc.questao.proxima.useQuery(
    { atualId: id },
    { enabled: Boolean(responder.data) && !onProxima },
  )

  const irParaProxima = () => {
    if (onProxima) {
      onProxima()
      return
    }
    if (proximaQ.data?.id) {
      router.push(`/questoes/${proximaQ.data.id}`)
    } else {
      toast.info('Você respondeu todas as questões disponíveis. 🎉')
      router.push('/questoes')
    }
  }

  if (questao.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (questao.error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
        <p className="font-semibold text-rose-900">Erro ao carregar questão</p>
        <p className="mt-1 text-sm text-rose-800">{questao.error.message}</p>
        <Button asChild className="mt-3" size="sm">
          <Link href="/questoes">Voltar ao banco</Link>
        </Button>
      </div>
    )
  }
  if (!questao.data) return <div>Questão não encontrada.</div>

  const q = questao.data
  const respondida = responder.data
  const correta = respondida?.correta
  const corBanca = q.banca?.cor ?? '#AB5D21'
  const codigoBanca = q.banca?.codigo ?? '?'
  const alternativas = q.alternativas ?? []

  const submeter = () => {
    if (!escolha) return
    responder.mutate({
      questaoId: q.id,
      alternativaLetra: escolha as Letra,
      tempoSegundos: Math.max(1, tempoSegundos),
      confianca,
      sessaoId,
      modoRevisao: false,
    })
  }

  const min = Math.floor(tempoSegundos / 60)
    .toString()
    .padStart(2, '0')
  const seg = (tempoSegundos % 60).toString().padStart(2, '0')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/questoes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar ao banco
        </Link>
        {progresso && (
          <span className="text-sm font-medium tabular-nums">
            Questão {progresso.atual} de {progresso.total}
          </span>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          {min}:{seg}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
          style={{ background: corBanca }}
        >
          {codigoBanca}
        </span>
        <span className="text-muted-foreground">{q.ano}</span>
      </div>

      {q.enunciadoVignette ? (
        <Card>
          <CardContent className="pt-6">
            <p className="whitespace-pre-line text-sm leading-relaxed">{q.enunciadoVignette}</p>
          </CardContent>
        </Card>
      ) : null}

      <p className="font-medium leading-relaxed">{q.enunciado}</p>

      <div className="space-y-2" role="radiogroup" aria-label="Alternativas">
        {alternativas.map((a) => {
          const ehGabarito = !!respondida && a.letra === respondida.gabaritoLetra
          const ehEscolhidaErrada = !!respondida && a.letra === escolha && !correta
          const selecionada = escolha === a.letra
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => !respondida && setEscolha(a.letra)}
              disabled={!!respondida}
              className={cn(
                'flex w-full cursor-pointer items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                !respondida && 'hover:border-primary',
                selecionada && !respondida && 'border-primary bg-primary/5',
                ehGabarito && 'border-emerald-500 bg-emerald-50',
                ehEscolhidaErrada && 'border-rose-500 bg-rose-50',
                respondida && 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                  selecionada ? 'border-primary' : 'border-muted-foreground/30',
                )}
              >
                {selecionada ? <span className="size-2 rounded-full bg-primary" /> : null}
              </span>
              <div className="flex-1 text-sm leading-relaxed">
                <span className="font-semibold mr-2">{a.letra})</span>
                {a.texto}
              </div>
              {ehGabarito ? <Check className="size-5 text-emerald-600 shrink-0" /> : null}
              {ehEscolhidaErrada ? <X className="size-5 text-rose-600 shrink-0" /> : null}
            </button>
          )
        })}
      </div>

      {!respondida ? (
        <>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="text-sm font-medium" id="rotulo-confianca">
                Antes de ver o gabarito: quanto você tem certeza?
              </div>
              <div
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                role="radiogroup"
                aria-labelledby="rotulo-confianca"
              >
                {OPCOES_CONFIANCA.map((c) => (
                  <Button
                    key={c.v}
                    type="button"
                    role="radio"
                    aria-checked={confianca === c.v}
                    variant={confianca === c.v ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setConfianca(c.v)}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Button size="lg" onClick={submeter} disabled={!escolha} loading={responder.isPending}>
            Confirmar resposta
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <CorrecaoPainel
            questaoId={q.id}
            escolha={escolha ?? ''}
            confianca={confianca}
            correcao={respondida}
            temas={q.temas}
            guidelines={q.guidelines}
          />

          <div className="flex flex-wrap gap-3">
            <Button onClick={irParaProxima} loading={!onProxima && proximaQ.isLoading}>
              Próxima questão <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" asChild>
              <Link href="/questoes">Voltar ao banco</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
