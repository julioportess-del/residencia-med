'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronRight, Search, Timer, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'
import { ListasInteligentes } from './listas-inteligentes'

const DIFICULDADES = [
  { v: 'FACIL', label: 'Fácil', cor: 'bg-emerald-100 text-emerald-700' },
  { v: 'MEDIO', label: 'Médio', cor: 'bg-amber-100 text-amber-700' },
  { v: 'DIFICIL', label: 'Difícil', cor: 'bg-rose-100 text-rose-700' },
  { v: 'MUITO_DIFICIL', label: 'Muito difícil', cor: 'bg-red-100 text-red-700' },
] as const

export const SITUACOES = [
  { v: 'TODAS', label: 'Todas' },
  { v: 'INEDITAS', label: 'Inéditas para mim' },
  { v: 'RESPONDIDAS', label: 'Já respondidas' },
  { v: 'ERRADAS', label: 'Errei' },
  { v: 'ACERTADAS', label: 'Acertei' },
  { v: 'CERTEZA_ERRADA', label: 'Errei com certeza' },
  { v: 'CHUTES_CERTOS', label: 'Acertei no chute' },
  { v: 'REVISAO_VENCIDA', label: 'Revisão vencida' },
] as const

type Situacao = (typeof SITUACOES)[number]['v']
type Dificuldade = (typeof DIFICULDADES)[number]['v']

const TODOS = 'todos'
const POR_PAGINA = 30
const ATRASO_BUSCA_MS = 350

function ehSituacao(v: string | null): v is Situacao {
  return SITUACOES.some((s) => s.v === v)
}
function ehDificuldade(v: string | null): v is Dificuldade {
  return DIFICULDADES.some((d) => d.v === v)
}

/** Filtros vivem na URL: dá para salvar como favorito e compartilhar com o próprio celular. */
function useFiltrosUrl() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filtros = {
    banca: params.get('banca') ?? undefined,
    ano: params.get('ano') ? Number(params.get('ano')) : undefined,
    esp: params.get('esp') ?? undefined,
    dif: ehDificuldade(params.get('dif')) ? (params.get('dif') as Dificuldade) : undefined,
    situacao: ehSituacao(params.get('sit')) ? (params.get('sit') as Situacao) : 'TODAS',
    q: params.get('q') ?? '',
  }

  function atualizar(mudancas: Record<string, string | number | undefined>) {
    const novo = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(mudancas)) {
      if (v === undefined || v === '' || v === TODOS) novo.delete(k)
      else novo.set(k, String(v))
    }
    router.replace(`${pathname}?${novo.toString()}`, { scroll: false })
  }

  return { filtros, atualizar, limpar: () => router.replace(pathname, { scroll: false }) }
}

export function QuestoesLista() {
  const router = useRouter()
  const { filtros, atualizar, limpar } = useFiltrosUrl()
  const [busca, setBusca] = useState(filtros.q)

  useEffect(() => {
    const t = setTimeout(() => {
      if (busca !== filtros.q) atualizar({ q: busca })
    }, ATRASO_BUSCA_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca])

  const opcoes = trpc.questao.filtrosDisponiveis.useQuery()
  const bancaSelecionada = opcoes.data?.bancas.find((b) => b.id === filtros.banca)

  const filtrosApi = useMemo(
    () => ({
      bancaIds: filtros.banca ? [filtros.banca] : undefined,
      anos: filtros.ano ? [filtros.ano] : undefined,
      especialidadeIds: filtros.esp ? [filtros.esp] : undefined,
      dificuldades: filtros.dif ? [filtros.dif] : undefined,
      situacao: filtros.situacao,
      query: filtros.q || undefined,
    }),
    [filtros.banca, filtros.ano, filtros.esp, filtros.dif, filtros.situacao, filtros.q],
  )

  const questoes = trpc.questao.listar.useInfiniteQuery(
    { ...filtrosApi, limit: POR_PAGINA },
    { getNextPageParam: (ultima) => ultima.proxCursor },
  )
  const itens = questoes.data?.pages.flatMap((p) => p.itens) ?? []
  const total = questoes.data?.pages[0]?.total

  const criarSessao = trpc.sessao.criar.useMutation({
    onError: (e) => toast.error(e.message),
  })

  async function iniciar(modo: 'ESTUDO' | 'SIMULADO') {
    const provaHistorica = Boolean(filtros.banca && filtros.ano)
    const res = await criarSessao.mutateAsync({
      tipo: modo,
      filtros: filtrosApi,
      numeroQuestoes: Math.min(total ?? 20, modo === 'SIMULADO' ? 100 : 30),
      ordem: provaHistorica ? 'SEQUENCIAL' : 'ALEATORIA',
      ...(modo === 'SIMULADO'
        ? { tempoMinutos: Math.max(10, Math.round(Math.min(total ?? 20, 100) * 2.4)) }
        : {}),
    })
    router.push(modo === 'SIMULADO' ? `/simulado/${res.sessaoId}` : `/estudo/${res.sessaoId}`)
  }

  const temFiltro =
    filtros.banca ||
    filtros.ano ||
    filtros.esp ||
    filtros.dif ||
    filtros.q ||
    filtros.situacao !== 'TODAS'

  return (
    <div className="mt-6 space-y-6">
      <ListasInteligentes
        onEscolher={(f) =>
          atualizar({
            sit: f.situacao,
            banca: f.bancaIds?.[0],
            ano: undefined,
            esp: undefined,
            dif: undefined,
            q: undefined,
          })
        }
      />

      <section aria-label="Filtros" className="space-y-3 rounded-xl border bg-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por palavra-chave (ex.: pré-eclâmpsia, sulfato de magnésio)"
            className="pl-9"
            aria-label="Buscar questões"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <Select
            value={filtros.banca ?? TODOS}
            onValueChange={(v) => atualizar({ banca: v, ano: undefined })}
          >
            <SelectTrigger aria-label="Banca">
              <SelectValue placeholder="Banca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as bancas</SelectItem>
              {opcoes.data?.bancas.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.codigo} ({b.total})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filtros.ano ? String(filtros.ano) : TODOS}
            onValueChange={(v) => atualizar({ ano: v })}
            disabled={!bancaSelecionada}
          >
            <SelectTrigger aria-label="Ano">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os anos</SelectItem>
              {bancaSelecionada?.anos.map((a) => (
                <SelectItem key={a.ano} value={String(a.ano)}>
                  {a.ano} ({a.total})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtros.esp ?? TODOS} onValueChange={(v) => atualizar({ esp: v })}>
            <SelectTrigger aria-label="Área">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as áreas</SelectItem>
              {opcoes.data?.especialidades.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome} ({e.total})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtros.dif ?? TODOS} onValueChange={(v) => atualizar({ dif: v })}>
            <SelectTrigger aria-label="Dificuldade">
              <SelectValue placeholder="Dificuldade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as dificuldades</SelectItem>
              {DIFICULDADES.map((d) => (
                <SelectItem key={d.v} value={d.v}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filtros.situacao}
            onValueChange={(v) => atualizar({ sit: v === 'TODAS' ? undefined : v })}
          >
            <SelectTrigger aria-label="Situação">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              {SITUACOES.map((s) => (
                <SelectItem key={s.v} value={s.v}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="text-sm text-muted-foreground" aria-live="polite">
            {total === undefined ? 'Contando…' : `${total} ${total === 1 ? 'questão' : 'questões'}`}
            {temFiltro && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={() => {
                  setBusca('')
                  limpar()
                }}
              >
                <X className="size-3.5" /> Limpar filtros
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => void iniciar('ESTUDO')}
              disabled={!total}
              loading={criarSessao.isPending}
            >
              <BookOpen className="size-4" /> Estudar estas
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void iniciar('SIMULADO')}
              disabled={!total}
            >
              <Timer className="size-4" />
              {filtros.banca && filtros.ano ? 'Fazer a prova completa' : 'Fazer como prova'}
            </Button>
          </div>
        </div>
      </section>

      {!questoes.data && !questoes.error ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : questoes.error ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-destructive">
          Não foi possível carregar as questões. Recarregue a página.
        </div>
      ) : itens.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          Nenhuma questão encontrada com esses filtros.
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map((q) => {
            const dif = DIFICULDADES.find((d) => d.v === q.dificuldade)
            return (
              <Link key={q.id} href={`/questoes/${q.id}`} className="block">
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge style={{ background: q.banca.cor ?? '#3e7a72', color: 'white' }}>
                            {q.banca.codigo}
                          </Badge>
                          <span>{q.ano}</span>
                          {q.temaPrincipal && <span>· {q.temaPrincipal.nome}</span>}
                          {q.jaRespondida && <span className="text-emerald-600">· respondida</span>}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm">{q.resumo}…</p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          dif?.cor,
                        )}
                      >
                        {dif?.label}
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
          {questoes.hasNextPage && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void questoes.fetchNextPage()}
              loading={questoes.isFetchingNextPage}
            >
              Carregar mais
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
