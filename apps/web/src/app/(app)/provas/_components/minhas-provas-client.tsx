'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CalendarDays,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import type { ProcessoSeletivoInput } from '@residencia-med/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { ETAPAS, formatarDia } from '@/lib/minhas-provas'
import { trpc } from '@/lib/trpc/client'
import { ProcessoFormDialog } from './processo-form'
import { paraInput, type ProcessoListado } from './tipos'

type ChaveCheck = keyof Pick<
  ProcessoSeletivoInput,
  'editalPublicado' | 'inscricaoFeita' | 'inscricaoPaga' | 'logisticaOrganizada' | 'provaRealizada'
>

const CHECKLIST: { chave: ChaveCheck; rotulo: string }[] = [
  { chave: 'editalPublicado', rotulo: 'Edital' },
  { chave: 'inscricaoFeita', rotulo: 'Inscrição' },
  { chave: 'inscricaoPaga', rotulo: 'Pagamento' },
  { chave: 'logisticaOrganizada', rotulo: 'Logística' },
  { chave: 'provaRealizada', rotulo: 'Realizada' },
]

export function MinhasProvasClient() {
  const { data, isLoading, error } = trpc.minhasProvas.listar.useQuery()
  const [editando, setEditando] = useState<ProcessoListado | null>(null)
  const [aberto, setAberto] = useState(false)

  const abrir = (p: ProcessoListado | null) => {
    setEditando(p)
    setAberto(true)
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {data && data.length > 0
            ? `${data.length} ${data.length === 1 ? 'processo seletivo' : 'processos seletivos'}`
            : ' '}
        </p>
        <Button onClick={() => abrir(null)}>
          <Plus className="size-4" />
          Adicionar prova
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Não foi possível carregar suas provas. Tente recarregar a página.
          </CardContent>
        </Card>
      ) : !data || data.length === 0 ? (
        <EstadoVazio onAdicionar={() => abrir(null)} />
      ) : (
        <ul className="space-y-3">
          {data.map((p) => (
            <li key={p.id}>
              <ProcessoCard processo={p} onEditar={() => abrir(p)} />
            </li>
          ))}
        </ul>
      )}

      <ProcessoFormDialog aberto={aberto} onFechar={() => setAberto(false)} processo={editando} />
    </div>
  )
}

function EstadoVazio({ onAdicionar }: { onAdicionar: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <CalendarDays className="size-8 text-primary" />
        <div>
          <p className="font-medium">Nenhuma prova cadastrada</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Adicione os processos seletivos que vai prestar. O painel passa a mostrar a contagem
            regressiva e avisa prazos de inscrição, pagamento e logística.
          </p>
        </div>
        <Button onClick={onAdicionar}>
          <Plus className="size-4" />
          Adicionar primeira prova
        </Button>
      </CardContent>
    </Card>
  )
}

function ProcessoCard({
  processo: p,
  onEditar,
}: {
  processo: ProcessoListado
  onEditar: () => void
}) {
  const utils = trpc.useUtils()
  const invalidar = () =>
    Promise.all([utils.minhasProvas.listar.invalidate(), utils.dashboard.hoje.invalidate()])
  const atualizar = trpc.minhasProvas.atualizar.useMutation({
    onSuccess: invalidar,
    onError: (e) => toast.error(e.message),
  })
  const excluir = trpc.minhasProvas.excluir.useMutation({
    onSuccess: async () => {
      await invalidar()
      toast.success('Prova removida')
    },
    onError: (e) => toast.error(e.message),
  })

  const alternar = (chave: ChaveCheck) =>
    atualizar.mutate({ id: p.id, dados: { ...paraInput(p), [chave]: !p[chave] } })

  const confirmarExclusao = () => {
    if (window.confirm(`Remover ${p.instituicao} — ${p.especialidade}?`)) {
      excluir.mutate({ id: p.id })
    }
  }

  const etapa = ETAPAS[p.etapa]

  return (
    <Card className={cn(p.etapa === 'REALIZADA' && 'opacity-80')}>
      <CardContent className="space-y-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{p.instituicao}</h2>
              <Badge variant={etapa.variante}>{etapa.rotulo}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {p.especialidade}
              {p.numeroInscricao && ` · inscrição nº ${p.numeroInscricao}`}
              {p.banca && ` · banca ${p.banca.codigo}`}
            </p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEditar} aria-label="Editar prova">
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={confirmarExclusao}
              loading={excluir.isPending}
              aria-label="Remover prova"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Info rotulo="Inscrições">
            {p.inicioInscricoes || p.fimInscricoes
              ? `${formatarDia(p.inicioInscricoes)} a ${formatarDia(p.fimInscricoes)}`
              : '—'}
          </Info>
          <Info rotulo="Prova">{formatarDia(p.dataProva)}</Info>
          <Info rotulo="Local">
            {p.cidadeProva ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {p.cidadeProva}
              </span>
            ) : (
              '—'
            )}
          </Info>
          <Info rotulo="Acertos">
            {p.acertos === null
              ? '—'
              : `${p.acertos}${p.totalQuestoes ? `/${p.totalQuestoes}` : ''}${p.pctAcertos !== null ? ` (${p.pctAcertos}%)` : ''}`}
          </Info>
        </dl>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Checklist do processo">
          {CHECKLIST.map(({ chave, rotulo }) => (
            <button
              key={chave}
              type="button"
              aria-pressed={p[chave]}
              disabled={atualizar.isPending}
              onClick={() => alternar(chave)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
                p[chave]
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'text-muted-foreground hover:border-primary/60 hover:text-foreground',
              )}
            >
              {p[chave] ? '✓ ' : ''}
              {rotulo}
            </button>
          ))}
          {p.linkEdital && (
            <a
              href={p.linkEdital}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Ver edital <ExternalLink className="size-3" />
            </a>
          )}
        </div>

        {p.pendencias.length > 0 && (
          <ul className="space-y-1">
            {p.pendencias.map((pend) => (
              <li
                key={pend.tipo}
                className={cn(
                  'flex items-center gap-1.5 text-xs',
                  pend.urgente ? 'font-medium text-destructive' : 'text-muted-foreground',
                )}
              >
                <AlertTriangle className="size-3.5 shrink-0" />
                {pend.mensagem}
              </li>
            ))}
          </ul>
        )}

        {p.observacoes && (
          <p className="whitespace-pre-line border-t pt-3 text-sm text-muted-foreground">
            {p.observacoes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Info({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  )
}
