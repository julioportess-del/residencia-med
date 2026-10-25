'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, EyeOff, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { trpc } from '@/lib/trpc/client'

type Status = 'PENDENTE' | 'RESOLVIDO_OCULTO' | 'RESOLVIDO_MANTIDO'

const LABEL_MOTIVO: Record<string, string> = {
  SPAM: 'Spam',
  OFENSIVO: 'Ofensivo',
  FORA_DO_TEMA: 'Fora do tema',
  INFO_INCORRETA: 'Info incorreta',
  OUTRO: 'Outro',
}

export function ComunidadeAdmin() {
  const [status, setStatus] = useState<Status>('PENDENTE')
  const utils = trpc.useUtils()
  const contagens = trpc.adminComunidade.contagens.useQuery()
  const lista = trpc.adminComunidade.listarReportes.useQuery({ status })

  const ocultar = trpc.adminComunidade.ocultar.useMutation({
    onSuccess: async () => {
      toast.success('Conteúdo ocultado')
      await Promise.all([
        utils.adminComunidade.listarReportes.invalidate(),
        utils.adminComunidade.contagens.invalidate(),
      ])
    },
    onError: (e) => toast.error(e.message),
  })

  const manter = trpc.adminComunidade.manter.useMutation({
    onSuccess: async () => {
      toast.success('Reporte resolvido sem ação')
      await Promise.all([
        utils.adminComunidade.listarReportes.invalidate(),
        utils.adminComunidade.contagens.invalidate(),
      ])
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="mt-6 space-y-4">
      <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
        <TabsList>
          <TabsTrigger value="PENDENTE">
            Pendentes
            {contagens.data && contagens.data.PENDENTE > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {contagens.data.PENDENTE}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="RESOLVIDO_OCULTO">Ocultados</TabsTrigger>
          <TabsTrigger value="RESOLVIDO_MANTIDO">Mantidos</TabsTrigger>
        </TabsList>
      </Tabs>

      {lista.isLoading ? (
        <Skeleton className="h-40" />
      ) : !lista.data || lista.data.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            Nenhum reporte neste status.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {lista.data.map((r) => {
            const alvo = r.post
              ? {
                  tipo: 'post' as const,
                  titulo: r.post.titulo,
                  corpo: r.post.corpo,
                  link: `/comunidade/${r.post.id}`,
                  autor: r.post.user,
                  oculto: !!r.post.ocultoEm,
                }
              : r.comentario
                ? {
                    tipo: 'comentário' as const,
                    titulo: `em "${r.comentario.post.titulo}"`,
                    corpo: r.comentario.corpo,
                    link: `/comunidade/${r.comentario.post.id}`,
                    autor: r.comentario.user,
                    oculto: !!r.comentario.ocultoEm,
                  }
                : null
            if (!alvo) return null
            return (
              <li key={r.id}>
                <Card>
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Flag className="size-3 text-destructive" />
                      <Badge variant="outline">{LABEL_MOTIVO[r.motivo] ?? r.motivo}</Badge>
                      <Badge variant="secondary">{alvo.tipo}</Badge>
                      {alvo.oculto && <Badge className="bg-amber-600">oculto</Badge>}
                      <span className="text-muted-foreground">
                        reportado por {r.user.name ?? r.user.email} ·{' '}
                        {formatDistanceToNow(new Date(r.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    <div>
                      <Link
                        href={alvo.link}
                        className="text-sm font-medium hover:underline"
                        target="_blank"
                      >
                        {alvo.titulo}
                      </Link>
                      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                        {alvo.corpo}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        autor: {alvo.autor.name ?? alvo.autor.email}
                      </p>
                    </div>

                    {r.detalhes && (
                      <div className="rounded-md border-l-2 border-muted bg-muted/30 px-3 py-2 text-xs">
                        <span className="font-semibold">Detalhes do denunciante: </span>
                        {r.detalhes}
                      </div>
                    )}

                    {r.status === 'PENDENTE' && (
                      <div className="flex gap-2 border-t pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => manter.mutate({ reporteId: r.id })}
                          disabled={manter.isPending}
                        >
                          <Check className="mr-1 size-4" /> Manter
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => ocultar.mutate({ reporteId: r.id })}
                          disabled={ocultar.isPending}
                        >
                          <EyeOff className="mr-1 size-4" /> Ocultar conteúdo
                        </Button>
                      </div>
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
