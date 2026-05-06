'use client'

import Link from 'next/link'
import { useState } from 'react'
import { format } from 'date-fns'
import { Bell, Check, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

const ICONE_TIPO: Record<string, string> = {
  REVISAO_VENCENDO: '⏰',
  PLANO_ATIVADO: '✅',
  PLANO_CANCELADO: '⚠️',
  PLANO_INADIMPLENTE: '💳',
  CONVITE_ORG: '🏢',
  SIMULADO_LIVE_CONVITE: '🔴',
  CONTRIBUICAO_APROVADA: '🎉',
  CONTRIBUICAO_REJEITADA: '❌',
  CONTRIBUICAO_VALIDADA_IA: '🤖',
  PROFICIENCIA_MARCO: '📈',
  SISTEMA: '📢',
}

export function NotificacoesSino() {
  const [aberto, setAberto] = useState(false)
  const utils = trpc.useUtils()

  const count = trpc.notificacoes.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
  const lista = trpc.notificacoes.listar.useQuery(
    { limit: 20 },
    { enabled: aberto },
  )

  const marcarLida = trpc.notificacoes.marcarLida.useMutation({
    onSuccess: () => {
      void utils.notificacoes.unreadCount.invalidate()
      void utils.notificacoes.listar.invalidate()
    },
  })
  const marcarTodas = trpc.notificacoes.marcarTodasLidas.useMutation({
    onSuccess: () => {
      void utils.notificacoes.unreadCount.invalidate()
      void utils.notificacoes.listar.invalidate()
    },
  })
  const excluir = trpc.notificacoes.excluir.useMutation({
    onSuccess: () => {
      void utils.notificacoes.unreadCount.invalidate()
      void utils.notificacoes.listar.invalidate()
    },
  })

  const unread = count.data ?? 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="relative flex size-8 items-center justify-center rounded-full hover:bg-secondary"
        aria-label="Notificações"
      >
        <Bell className="size-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {aberto && (
        <>
          {/* overlay click-out */}
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-semibold">Notificações</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => marcarTodas.mutate()}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Check className="size-3" />
                  Marcar todas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {lista.isLoading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : !lista.data || lista.data.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Sem notificações.
                </div>
              ) : (
                <ul className="divide-y">
                  {lista.data.map((n) => {
                    const lida = !!n.lidaEm
                    const conteudo = (
                      <div className="flex gap-2.5 p-3">
                        <span className="text-xl shrink-0">{ICONE_TIPO[n.tipo] ?? '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-sm font-medium',
                                lida ? 'text-muted-foreground' : 'text-foreground',
                              )}
                            >
                              {n.titulo}
                            </span>
                            {!lida && (
                              <span className="size-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          {n.conteudo && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                              {n.conteudo}
                            </p>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {format(n.createdAt, 'dd/MM HH:mm')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            excluir.mutate({ id: n.id })
                          }}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          aria-label="Excluir notificação"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )
                    if (n.link) {
                      return (
                        <li key={n.id}>
                          <Link
                            href={n.link}
                            className="block hover:bg-muted/50"
                            onClick={() => {
                              if (!lida) marcarLida.mutate({ id: n.id })
                              setAberto(false)
                            }}
                          >
                            {conteudo}
                          </Link>
                        </li>
                      )
                    }
                    return (
                      <li
                        key={n.id}
                        className={cn(
                          'cursor-pointer hover:bg-muted/50',
                          !lida && 'bg-primary/5',
                        )}
                        onClick={() => !lida && marcarLida.mutate({ id: n.id })}
                      >
                        {conteudo}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
