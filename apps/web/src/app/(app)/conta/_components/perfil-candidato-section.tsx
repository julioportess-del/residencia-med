'use client'

import { useEffect, useState } from 'react'
import { HeartPulse } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

type Disc = 'ANALISTA' | 'COMUNICADOR' | 'EXECUTOR' | 'CONCILIADOR' | null
type Socio = 'TAREFAS' | 'PESSOAS' | 'IDEIAS' | 'SISTEMAS' | null
type Procrast = 'LEVE' | 'MODERADA' | 'SEVERA' | null
type Memoria = 'BAIXA' | 'MEDIA' | 'ACIMA_DA_MEDIA' | 'ALTA' | null

const PERGUNTA_DISC = {
  titulo: 'Qual frase mais descreve você no estudo?',
  opcoes: [
    { v: 'ANALISTA' as const, texto: 'Prefiro analisar tudo em profundidade antes de agir.' },
    { v: 'COMUNICADOR' as const, texto: 'Aprendo melhor explicando para alguém ou em grupo.' },
    { v: 'EXECUTOR' as const, texto: 'Vou direto à ação — faço, depois ajusto.' },
    { v: 'CONCILIADOR' as const, texto: 'Mantenho ritmo estável e priorizo equilíbrio.' },
  ],
}

const PERGUNTA_SOCIO = {
  titulo: 'O que te motiva mais no dia a dia?',
  opcoes: [
    { v: 'TAREFAS' as const, texto: 'Tarefas e metas concretas.' },
    { v: 'PESSOAS' as const, texto: 'Pessoas e relações.' },
    { v: 'IDEIAS' as const, texto: 'Ideias e aprendizado novo.' },
    { v: 'SISTEMAS' as const, texto: 'Sistemas, processos e organização.' },
  ],
}

const PERGUNTA_PROCRAST = {
  titulo: 'Com que frequência você posterga o estudo?',
  opcoes: [
    { v: 'LEVE' as const, texto: 'Quase nunca — bato minhas metas.' },
    { v: 'MODERADA' as const, texto: 'Às vezes — depende do assunto.' },
    { v: 'SEVERA' as const, texto: 'Frequente — tenho dificuldade de começar.' },
  ],
}

const PERGUNTA_MEMORIA = {
  titulo: 'Como você avalia sua memória para o que estuda?',
  opcoes: [
    { v: 'BAIXA' as const, texto: 'Esqueço rápido — preciso de muita revisão.' },
    { v: 'MEDIA' as const, texto: 'Mediana — depende do interesse.' },
    { v: 'ACIMA_DA_MEDIA' as const, texto: 'Boa — lembro bem com uma ou duas revisões.' },
    { v: 'ALTA' as const, texto: 'Excelente — fixo bem já na primeira passada.' },
  ],
}

export function PerfilCandidatoSection() {
  const dados = trpc.perfilCandidato.atual.useQuery()
  const utils = trpc.useUtils()
  const salvar = trpc.perfilCandidato.salvar.useMutation({
    onSuccess: () => {
      toast.success('Perfil salvo.')
      utils.perfilCandidato.atual.invalidate()
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao salvar'),
  })

  const [disc, setDisc] = useState<Disc>(null)
  const [socio, setSocio] = useState<Socio>(null)
  const [procrast, setProcrast] = useState<Procrast>(null)
  const [memoria, setMemoria] = useState<Memoria>(null)

  useEffect(() => {
    if (dados.data) {
      setDisc(dados.data.disc ?? null)
      setSocio(dados.data.socioemocional ?? null)
      setProcrast(dados.data.procrastinacao ?? null)
      setMemoria(dados.data.memoria ?? null)
    }
  }, [dados.data])

  if (dados.isLoading) return <Skeleton className="h-80" />

  return (
    <Card id="perfil-candidato">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="size-4" />
          Perfil do Candidato (teste rápido)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Quatro perguntas rápidas que ajudam a adequar o seu plano ao seu perfil. Pode refazer a
          qualquer momento.
        </p>
        <div className="space-y-6">
          <Pergunta<Disc> dados={PERGUNTA_DISC} selecionado={disc} onChange={(v) => setDisc(v)} />
          <Pergunta<Socio>
            dados={PERGUNTA_SOCIO}
            selecionado={socio}
            onChange={(v) => setSocio(v)}
          />
          <Pergunta<Procrast>
            dados={PERGUNTA_PROCRAST}
            selecionado={procrast}
            onChange={(v) => setProcrast(v)}
          />
          <Pergunta<Memoria>
            dados={PERGUNTA_MEMORIA}
            selecionado={memoria}
            onChange={(v) => setMemoria(v)}
          />
          <Button
            onClick={() =>
              salvar.mutate({
                disc,
                socioemocional: socio,
                procrastinacao: procrast,
                memoria,
              })
            }
            loading={salvar.isPending}
          >
            Salvar perfil
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Pergunta<T extends string | null>({
  dados,
  selecionado,
  onChange,
}: {
  dados: { titulo: string; opcoes: ReadonlyArray<{ v: NonNullable<T>; texto: string }> }
  selecionado: T
  onChange: (v: T) => void
}) {
  return (
    <div>
      <Label className="text-sm font-medium">{dados.titulo}</Label>
      <div className="mt-2 space-y-1.5">
        {dados.opcoes.map((o) => {
          const marcado = selecionado === o.v
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v as T)}
              className={
                'flex w-full items-start gap-3 rounded-md border p-3 text-left text-sm transition-colors ' +
                (marcado
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border hover:bg-secondary')
              }
            >
              <span
                className={
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ' +
                  (marcado ? 'border-primary bg-primary' : 'border-muted-foreground')
                }
              >
                {marcado && <span className="size-1.5 rounded-full bg-primary-foreground" />}
              </span>
              {o.texto}
            </button>
          )
        })}
      </div>
    </div>
  )
}
