'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Check, Download, Eye, FileText, Lightbulb, Map, Presentation, Video } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { trpc } from '@/lib/trpc/client'
import { useAutosaveProgresso } from '@/hooks/use-autosave-progresso'
import { VigiliaToggle } from './vigilia-toggle'

// Mux Player é client-only — carrega dinamicamente para não quebrar SSR.
const MuxPlayer = dynamic(() => import('@mux/mux-player-react').then((m) => m.default), {
  ssr: false,
  loading: () => <Skeleton className="aspect-video w-full" />,
})

const ICONE_MATERIAL = {
  MAPA_MENTAL: Map,
  APOSTILA: FileText,
  RESUMO_ESTRATEGICO: Lightbulb,
  SLIDE_AULA: Presentation,
  OUTRO: FileText,
} as const

const LABEL_MATERIAL = {
  MAPA_MENTAL: 'Mapa Mental',
  APOSTILA: 'Apostila',
  RESUMO_ESTRATEGICO: 'Resumo Estratégico',
  SLIDE_AULA: 'Slide da Aula',
  OUTRO: 'Material',
} as const

function MuxAulaPlayer({
  aulaId,
  playbackId,
  titulo,
  videoId,
  thumbUrl,
  startTime,
  duracaoS,
  concluida,
}: {
  aulaId: string
  playbackId: string
  titulo: string
  videoId: string
  thumbUrl: string | null
  startTime: number
  duracaoS: number
  concluida: boolean
}) {
  const { onTimeUpdate, onPause, onEnded } = useAutosaveProgresso({
    aulaId,
    duracaoS,
    concluida,
  })
  return (
    <MuxPlayer
      streamType="on-demand"
      playbackId={playbackId}
      metadata={{ video_title: titulo, video_id: videoId }}
      accentColor="#AB5D21"
      poster={thumbUrl ?? undefined}
      startTime={startTime > 0 ? startTime : undefined}
      onTimeUpdate={onTimeUpdate}
      onPause={onPause}
      onEnded={onEnded}
      style={{ width: '100%', aspectRatio: '16 / 9' }}
    />
  )
}

export function AulaPlayer({
  fase,
  areaSlug,
  disciplinaSlug,
  aulaSlug,
}: {
  fase: 'EXTENSIVO' | 'RETA_FINAL'
  areaSlug: string
  disciplinaSlug: string
  aulaSlug: string
}) {
  const { data: aula, isLoading } = trpc.cursos.obterAula.useQuery({
    fase,
    areaSlug,
    disciplinaSlug,
    aulaSlug,
  })
  const utils = trpc.useUtils()
  const marcar = trpc.cursos.marcarConcluida.useMutation({
    onSuccess: () => {
      toast.success('Progresso atualizado.')
      utils.cursos.obterAula.invalidate()
      utils.cursos.obterDisciplina.invalidate()
    },
  })

  const [videoAtivoId, setVideoAtivoId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-80" />
      </div>
    )
  }
  if (!aula) return null

  const videos = aula.videos
  const videoAtivo = videos.find((v) => v.id === videoAtivoId) ?? videos[0] ?? null
  const progressoAtual = aula.progresso[0] ?? null
  const concluida = progressoAtual?.concluida ?? false
  // Aula já concluída → reassiste do começo. Caso contrário, retoma de onde parou.
  const tempoAssistidoInicial = concluida ? 0 : (progressoAtual?.tempoAssistidoS ?? 0)
  const duracaoAtiva = videoAtivo?.duracaoS ?? 0

  return (
    <>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">
            {aula.disciplina.grandeArea.nome} · {aula.disciplina.nome}
          </div>
          <h1 className="mt-1 text-2xl font-bold">{aula.titulo}</h1>
          {aula.descricao && <p className="mt-2 text-sm text-muted-foreground">{aula.descricao}</p>}
        </div>
        <VigiliaToggle />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          {videoAtivo ? (
            <div className="overflow-hidden rounded-lg bg-black">
              {videoAtivo.provider === 'mux' ? (
                <MuxAulaPlayer
                  aulaId={aula.id}
                  playbackId={videoAtivo.providerId}
                  titulo={videoAtivo.titulo}
                  videoId={videoAtivo.id}
                  thumbUrl={videoAtivo.thumbUrl}
                  startTime={tempoAssistidoInicial}
                  duracaoS={duracaoAtiva}
                  concluida={concluida}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">
                  Player para provider &quot;{videoAtivo.provider}&quot; ainda não configurado.
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed bg-muted/40 text-sm text-muted-foreground">
              Esta aula ainda não tem vídeo associado.
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm">
              {videoAtivo && (
                <>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                      videoAtivo.tipo === 'BASE'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-amber-500/15 text-amber-700',
                    )}
                  >
                    {videoAtivo.tipo}
                  </span>
                  <span className="ml-2 font-medium">{videoAtivo.titulo}</span>
                  {videoAtivo.apresentador && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      com {videoAtivo.apresentador}
                    </span>
                  )}
                </>
              )}
            </div>
            <Button
              type="button"
              variant={concluida ? 'primary' : 'outline'}
              size="sm"
              onClick={() => marcar.mutate({ aulaId: aula.id, concluida: !concluida })}
              loading={marcar.isPending}
            >
              <Check className="size-4" />
              {concluida ? 'Concluída' : 'Marcar concluída'}
            </Button>
          </div>

          {aula.materiais.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Materiais
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {aula.materiais.map((m) => {
                  const Icone = ICONE_MATERIAL[m.tipo]
                  const label = LABEL_MATERIAL[m.tipo]
                  return (
                    <Card key={m.id}>
                      <CardContent className="flex items-center gap-3 p-3">
                        <Icone className="size-5 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{m.titulo}</div>
                          <div className="text-[10px] text-muted-foreground">{label}</div>
                        </div>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          aria-label="Visualizar"
                        >
                          <Eye className="size-4" />
                        </a>
                        <a
                          href={m.url}
                          download
                          className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          aria-label="Baixar"
                        >
                          <Download className="size-4" />
                        </a>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {videos.length > 1 && (
          <aside>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Lista de aulas
            </h2>
            <ul className="divide-y rounded-md border">
              {videos.map((v) => {
                const selecionado = v.id === videoAtivo?.id
                const minutos = Math.round(v.duracaoS / 60)
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => setVideoAtivoId(v.id)}
                      className={cn(
                        'flex w-full items-center gap-3 p-3 text-left text-sm transition-colors',
                        selecionado ? 'bg-primary/5' : 'hover:bg-accent/40',
                      )}
                    >
                      <Video
                        className={cn(
                          'size-4 shrink-0',
                          selecionado ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                              v.tipo === 'BASE'
                                ? 'bg-primary/15 text-primary'
                                : 'bg-amber-500/15 text-amber-700',
                            )}
                          >
                            {v.tipo}
                          </span>
                          {minutos > 0 && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {minutos}min
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate">{v.titulo}</div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>
        )}
      </div>
    </>
  )
}
