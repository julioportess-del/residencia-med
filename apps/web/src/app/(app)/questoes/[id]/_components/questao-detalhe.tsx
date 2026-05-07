'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { ExplicarComIA } from '@/components/explicar-ia-dialog'
import { GerarSimilarDialog } from '@/components/gerar-similar-dialog'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type Confianca = 'CHUTE' | 'INCERTO' | 'CONFIANTE'

export function QuestaoDetalhe({ id, sessaoId }: { id: string; sessaoId?: string }) {
  const router = useRouter()
  const questao = trpc.questao.detalhe.useQuery({ id })
  const [escolha, setEscolha] = useState<string | null>(null)
  const [confianca, setConfianca] = useState<Confianca>('INCERTO')
  const [inicio, setInicio] = useState(() => Date.now())
  const [tempoSegundos, setTempoSegundos] = useState(0)

  // Reset do estado local quando muda de questão
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
    { enabled: Boolean(responder.data) },
  )

  const irParaProxima = () => {
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
  const temaPrimario = q.temas?.find((t) => t.primario)
  const corBanca = q.banca?.cor ?? '#1d4ed8'
  const codigoBanca = q.banca?.codigo ?? '?'
  const alternativas = q.alternativas ?? []
  const guidelines = q.guidelines ?? []

  const submeter = () => {
    if (!escolha) return
    responder.mutate({
      questaoId: q.id,
      alternativaLetra: escolha as never,
      tempoSegundos: Math.max(1, tempoSegundos),
      confianca,
      sessaoId,
      modoRevisao: false,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/questoes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar ao banco
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          {Math.floor(tempoSegundos / 60)
            .toString()
            .padStart(2, '0')}
          :{(tempoSegundos % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <Badge style={{ background: corBanca, color: 'white' }}>{codigoBanca}</Badge>
        <span className="text-muted-foreground">{q.ano}</span>
        {temaPrimario?.tema?.nome ? (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{temaPrimario.tema.nome}</span>
          </>
        ) : null}
      </div>

      {q.enunciadoVignette ? (
        <Card>
          <CardContent className="pt-6">
            <p className="whitespace-pre-line text-sm leading-relaxed">{q.enunciadoVignette}</p>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <p className="font-medium leading-relaxed">{q.enunciado}</p>
      </div>

      <RadioGroup
        value={escolha ?? undefined}
        onValueChange={(v) => !respondida && setEscolha(v)}
        disabled={!!respondida}
      >
        {alternativas.map((a) => {
          const ehGabarito = !!respondida && a.letra === respondida.gabaritoLetra
          const ehEscolhidaErrada = !!respondida && a.letra === escolha && !correta
          return (
            <label
              key={a.id}
              htmlFor={a.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                !respondida && 'hover:border-primary',
                ehGabarito && 'border-emerald-500 bg-emerald-50',
                ehEscolhidaErrada && 'border-rose-500 bg-rose-50',
              )}
            >
              <RadioGroupItem id={a.id} value={a.letra} className="mt-1" />
              <div className="flex-1 text-sm leading-relaxed">
                <span className="font-semibold mr-2">{a.letra})</span>
                {a.texto}
              </div>
              {ehGabarito ? <Check className="size-5 text-emerald-600 shrink-0" /> : null}
              {ehEscolhidaErrada ? <X className="size-5 text-rose-600 shrink-0" /> : null}
            </label>
          )
        })}
      </RadioGroup>

      {!respondida ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="text-sm font-medium">Você está...</div>
            <div className="flex gap-2">
              {(['CHUTE', 'INCERTO', 'CONFIANTE'] as const).map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={confianca === c ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setConfianca(c)}
                >
                  {c === 'CHUTE' ? 'Chutando' : c === 'INCERTO' ? 'Incerto' : 'Confiante'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!respondida ? (
        <Button size="lg" onClick={submeter} disabled={!escolha} loading={responder.isPending}>
          Confirmar resposta
        </Button>
      ) : (
        <div className="space-y-4">
          <Card
            className={cn(
              correta ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50',
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 font-semibold">
                {correta ? (
                  <Check className="text-emerald-600" />
                ) : (
                  <X className="text-rose-600" />
                )}
                {correta
                  ? 'Resposta correta!'
                  : `Errou. O gabarito era ${respondida.gabaritoLetra}.`}
              </div>
            </CardContent>
          </Card>

          {respondida.explicacaoMd ? (
            <Card>
              <CardContent className="prose prose-sm max-w-none pt-6">
                <Markdown markdown={respondida.explicacaoMd} />
              </CardContent>
            </Card>
          ) : null}

          {guidelines.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium mb-2">Guidelines citados</div>
                <ul className="space-y-2">
                  {guidelines.map((g, i) => (
                    <li key={i} className="text-sm">
                      <Badge variant="outline">{g.guideline?.fonte ?? '—'}</Badge>{' '}
                      <span className="font-medium">{g.guideline?.titulo ?? ''}</span>
                      {g.guideline?.url ? (
                        <a
                          href={g.guideline.url}
                          target="_blank"
                          rel="noopener"
                          className="ml-2 text-primary underline"
                        >
                          ver
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={irParaProxima} loading={proximaQ.isLoading}>
              Próxima questão <ArrowRight className="size-4" />
            </Button>
            {escolha ? (
              <ExplicarComIA questaoId={q.id} alternativaEscolhida={escolha} />
            ) : null}
            <GerarSimilarDialog questaoId={q.id} />
            <Button variant="outline" asChild>
              <Link href="/questoes">Voltar ao banco</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Markdown({ markdown }: { markdown: string }) {
  if (!markdown) return null
  const blocks = markdown.split(/\n\n+/)
  return (
    <>
      {blocks.map((b, i) => {
        const trimmed = b.trim()
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={i} className="font-semibold text-base mt-4">
              {trimmed.slice(3)}
            </h3>
          )
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={i} className="font-semibold text-sm mt-3">
              {trimmed.slice(4)}
            </h4>
          )
        }
        if (trimmed.startsWith('- ')) {
          return (
            <ul key={i} className="list-disc pl-5 my-2">
              {trimmed.split('\n').map((linha, j) => (
                <li key={j} className="text-sm">
                  {linha.replace(/^- /, '')}
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="text-sm leading-relaxed my-2 whitespace-pre-line">
            {trimmed}
          </p>
        )
      })}
    </>
  )
}
