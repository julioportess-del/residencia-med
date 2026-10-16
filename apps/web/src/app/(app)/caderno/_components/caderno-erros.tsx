'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertTriangle, BookOpen, CheckCircle2, ChevronDown, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { ROTULO_MOTIVO_ERRO, type MotivoErro } from '@residencia-med/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RegistroErroForm } from '@/components/registro-erro-form'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type Aba = 'ABERTO' | 'CORRIGIDO' | 'RESOLVIDO'

const ABAS: Array<{ v: Aba; label: string; chave: 'abertos' | 'corrigidos' | 'resolvidos' }> = [
  { v: 'ABERTO', label: 'Abertos', chave: 'abertos' },
  { v: 'CORRIGIDO', label: 'Acertei depois', chave: 'corrigidos' },
  { v: 'RESOLVIDO', label: 'Resolvidos', chave: 'resolvidos' },
]

const formatoData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
})

export function CadernoErros() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const caderno = trpc.caderno.listar.useQuery()
  const [aba, setAba] = useState<Aba>('ABERTO')
  const [aberto, setAberto] = useState<string | null>(null)

  const registrar = trpc.caderno.registrar.useMutation({
    onSuccess: () => void utils.caderno.listar.invalidate(),
    onError: (e) => toast.error(e.message),
  })
  const criarSessao = trpc.sessao.criar.useMutation({
    onSuccess: ({ sessaoId }) => router.push(`/estudo/${sessaoId}`),
    onError: (e) => toast.error(e.message),
  })

  if (caderno.isLoading) return <Skeleton className="mt-6 h-96 w-full" />
  if (!caderno.data) return null

  const { contagem, padroes, itens } = caderno.data
  const visiveis = itens.filter((i) => i.status === aba)

  if (itens.length === 0) {
    return (
      <div className="mt-6 flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center text-sm text-muted-foreground">
        Nenhum erro registrado ainda. Seus erros aparecem aqui assim que você responder questões.
        <Button asChild size="sm">
          <Link href="/questoes">Ir para o banco de questões</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      {padroes.length > 0 && (
        <section aria-label="Padrões de erro" className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4 text-amber-500" /> Padrões detectados
          </h2>
          {padroes.map((p) => (
            <div
              key={p.tema}
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-950/30"
            >
              <div className="font-medium">
                {p.tema}: {p.quantidade} erros abertos
                {p.motivoPredominante &&
                  ` · principal motivo: ${ROTULO_MOTIVO_ERRO[p.motivoPredominante as MotivoErro].toLowerCase()}`}
              </div>
              <p className="mt-0.5 text-muted-foreground">{p.recomendacao}</p>
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Situação" className="flex gap-1 rounded-lg border p-1">
          {ABAS.map((a) => (
            <button
              key={a.v}
              type="button"
              role="tab"
              aria-selected={aba === a.v}
              onClick={() => setAba(a.v)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                aba === a.v
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary',
              )}
            >
              {a.label} <span className="tabular-nums opacity-80">({contagem[a.chave]})</span>
            </button>
          ))}
        </div>
        {contagem.abertos > 0 && (
          <Button
            size="sm"
            loading={criarSessao.isPending}
            onClick={() =>
              criarSessao.mutate({
                tipo: 'ESTUDO',
                filtros: { situacao: 'ERRADAS' },
                numeroQuestoes: Math.min(contagem.abertos, 30),
                ordem: 'ALEATORIA',
              })
            }
          >
            <BookOpen className="size-4" /> Refazer erros abertos
          </Button>
        )}
      </div>

      {aba === 'ABERTO' && contagem.semMotivo > 0 && (
        <p className="text-xs text-muted-foreground">
          {contagem.semMotivo} {contagem.semMotivo === 1 ? 'erro está' : 'erros estão'} sem motivo
          registrado. Registrar o motivo é o que permite detectar padrões.
        </p>
      )}

      {visiveis.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          Nada aqui.
        </div>
      ) : (
        <ul className="space-y-2">
          {visiveis.map((e) => {
            const expandido = aberto === e.questaoId
            return (
              <li key={e.questaoId}>
                <Card>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {e.banca} {e.ano}
                          </span>
                          {e.tema && <span>· {e.tema}</span>}
                          <span>
                            · {e.erros} {e.erros === 1 ? 'erro' : 'erros'} em {e.tentativas}{' '}
                            {e.tentativas === 1 ? 'tentativa' : 'tentativas'}
                          </span>
                          <span>· último em {formatoData.format(e.ultimoErroEm)}</span>
                          {e.proximaRevisao && (
                            <span>· revisão {formatoData.format(e.proximaRevisao)}</span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm">{e.resumo}…</p>
                        {e.motivo && (
                          <span className="mt-1.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">
                            {ROTULO_MOTIVO_ERRO[e.motivo as MotivoErro]}
                          </span>
                        )}
                        {e.conceitoCorreto && !expandido && (
                          <p className="mt-1.5 border-l-2 border-primary pl-2 text-sm">
                            {e.conceitoCorreto}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/questoes/${e.questaoId}`}>
                          <RotateCcw className="size-3.5" /> Refazer
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-expanded={expandido}
                        onClick={() => setAberto(expandido ? null : e.questaoId)}
                      >
                        <ChevronDown
                          className={cn('size-3.5 transition-transform', expandido && 'rotate-180')}
                        />
                        {expandido ? 'Fechar' : 'Motivo e anotações'}
                      </Button>
                      {e.status !== 'RESOLVIDO' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            registrar.mutate({ questaoId: e.questaoId, resolvido: true })
                          }
                        >
                          <CheckCircle2 className="size-3.5" /> Marcar resolvido
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            registrar.mutate({ questaoId: e.questaoId, resolvido: false })
                          }
                        >
                          Reabrir
                        </Button>
                      )}
                    </div>
                    {expandido && (
                      <RegistroErroForm
                        questaoId={e.questaoId}
                        compacto
                        onSalvo={() => setAberto(null)}
                      />
                    )}
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
