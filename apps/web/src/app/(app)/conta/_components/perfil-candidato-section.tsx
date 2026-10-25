'use client'

import { useMemo, useState } from 'react'
import { HeartPulse, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import {
  calcularPerfilLape,
  ITENS_DISC,
  ITENS_MEMORIA,
  ITENS_PROCRASTINACAO,
  ITENS_SOCIO,
  type RespostasLape,
  type ValorLikert,
} from '@residencia-med/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

const ROTULOS_LIKERT = ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo muito']

const ROTULO_DISC: Record<string, string> = {
  ANALISTA: 'Analista',
  COMUNICADOR: 'Comunicador',
  EXECUTOR: 'Executor',
  CONCILIADOR: 'Conciliador',
}
const ROTULO_SOCIO: Record<string, string> = {
  TAREFAS: 'Tarefas e metas',
  PESSOAS: 'Pessoas e relações',
  IDEIAS: 'Ideias e aprendizado',
  SISTEMAS: 'Sistemas e processos',
}
const ROTULO_PROCRAST: Record<string, string> = {
  LEVE: 'Leve',
  MODERADA: 'Moderada',
  SEVERA: 'Severa',
}
const ROTULO_MEMORIA: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ACIMA_DA_MEDIA: 'Acima da média',
  ALTA: 'Alta',
}

export function PerfilCandidatoSection() {
  const dados = trpc.perfilCandidato.atual.useQuery()
  const utils = trpc.useUtils()
  const salvar = trpc.perfilCandidato.salvar.useMutation({
    onSuccess: () => {
      toast.success('Perfil salvo.')
      utils.perfilCandidato.atual.invalidate()
      setRespostas({})
      setRefazendo(false)
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao salvar'),
  })

  const [respostas, setRespostas] = useState<RespostasLape>({})
  const [refazendo, setRefazendo] = useState(false)

  const resultadoCalc = useMemo(() => calcularPerfilLape(respostas), [respostas])

  if (dados.isLoading) return <Skeleton className="h-80" />

  const jaRespondeu = dados.data?.concluidoEm != null
  const mostraFormulario = !jaRespondeu || refazendo

  return (
    <Card id="perfil-candidato">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="size-4" />
          Perfil do Candidato
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!mostraFormulario && dados.data && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Seu perfil atual — baseado nas suas respostas{' '}
              {dados.data.concluidoEm
                ? `em ${new Date(dados.data.concluidoEm).toLocaleDateString('pt-BR')}`
                : ''}
              . Pode refazer quando quiser.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ResumoDimensao
                titulo="Estilo"
                valor={dados.data.disc ? (ROTULO_DISC[dados.data.disc] ?? null) : null}
              />
              <ResumoDimensao
                titulo="Motivação"
                valor={
                  dados.data.socioemocional
                    ? (ROTULO_SOCIO[dados.data.socioemocional] ?? null)
                    : null
                }
              />
              <ResumoDimensao
                titulo="Procrastinação"
                valor={
                  dados.data.procrastinacao
                    ? (ROTULO_PROCRAST[dados.data.procrastinacao] ?? null)
                    : null
                }
              />
              <ResumoDimensao
                titulo="Memória (autoavaliação)"
                valor={dados.data.memoria ? (ROTULO_MEMORIA[dados.data.memoria] ?? null) : null}
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => setRefazendo(true)} className="mt-2">
              <RotateCcw className="mr-2 size-3.5" />
              Refazer teste
            </Button>
          </div>
        )}

        {mostraFormulario && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Autoavaliação em quatro dimensões — concorde ou discorde de cada frase. O resultado
              calibra sugestões do plano. Não é instrumento clínico.
            </p>

            <div className="space-y-8">
              <GrupoItens
                titulo="Como você estuda"
                itens={ITENS_DISC}
                respostas={respostas}
                onChange={(id, v) => setRespostas((r) => ({ ...r, [id]: v }))}
              />
              <GrupoItens
                titulo="O que te motiva"
                itens={ITENS_SOCIO}
                respostas={respostas}
                onChange={(id, v) => setRespostas((r) => ({ ...r, [id]: v }))}
              />
              <GrupoItens
                titulo="Procrastinação"
                itens={ITENS_PROCRASTINACAO}
                respostas={respostas}
                onChange={(id, v) => setRespostas((r) => ({ ...r, [id]: v }))}
              />
              <GrupoItens
                titulo="Memória (autopercepção)"
                itens={ITENS_MEMORIA}
                respostas={respostas}
                onChange={(id, v) => setRespostas((r) => ({ ...r, [id]: v }))}
              />
            </div>

            {resultadoCalc.completo && (
              <div className="mt-6 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-medium">Resultado parcial:</p>
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  <li>
                    Estilo:{' '}
                    <span className="font-medium text-foreground">
                      {resultadoCalc.disc ? ROTULO_DISC[resultadoCalc.disc] : '—'}
                    </span>
                  </li>
                  <li>
                    Motivação:{' '}
                    <span className="font-medium text-foreground">
                      {resultadoCalc.socioemocional
                        ? ROTULO_SOCIO[resultadoCalc.socioemocional]
                        : '—'}
                    </span>
                  </li>
                  <li>
                    Procrastinação:{' '}
                    <span className="font-medium text-foreground">
                      {resultadoCalc.procrastinacao
                        ? ROTULO_PROCRAST[resultadoCalc.procrastinacao]
                        : '—'}
                    </span>
                  </li>
                  <li>
                    Memória:{' '}
                    <span className="font-medium text-foreground">
                      {resultadoCalc.memoria ? ROTULO_MEMORIA[resultadoCalc.memoria] : '—'}
                    </span>
                  </li>
                </ul>
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <Button
                onClick={() =>
                  salvar.mutate({
                    disc: resultadoCalc.disc,
                    socioemocional: resultadoCalc.socioemocional,
                    procrastinacao: resultadoCalc.procrastinacao,
                    memoria: resultadoCalc.memoria,
                  })
                }
                loading={salvar.isPending}
                disabled={!resultadoCalc.completo}
              >
                Salvar perfil
              </Button>
              {refazendo && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRefazendo(false)
                    setRespostas({})
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function GrupoItens({
  titulo,
  itens,
  respostas,
  onChange,
}: {
  titulo: string
  itens: ReadonlyArray<{ id: string; texto: string }>
  respostas: RespostasLape
  onChange: (id: string, v: ValorLikert) => void
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </h3>
      <div className="mt-3 space-y-4">
        {itens.map((item) => (
          <div key={item.id}>
            <Label className="text-sm">{item.texto}</Label>
            <div className="mt-2 grid grid-cols-5 gap-1">
              {([1, 2, 3, 4, 5] as const).map((v) => {
                const marcado = respostas[item.id] === v
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onChange(item.id, v)}
                    aria-label={ROTULOS_LIKERT[v - 1]}
                    title={ROTULOS_LIKERT[v - 1]}
                    className={
                      'rounded-md border py-2 text-xs transition-colors ' +
                      (marcado
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:bg-secondary')
                    }
                  >
                    {v}
                  </button>
                )
              })}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Discordo</span>
              <span>Concordo</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResumoDimensao({ titulo, valor }: { titulo: string; valor: string | null }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{titulo}</div>
      <div className="mt-1 text-sm font-medium">{valor ?? '—'}</div>
    </div>
  )
}
