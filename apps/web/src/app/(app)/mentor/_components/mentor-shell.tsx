'use client'

import { useState } from 'react'
import { MessageSquarePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'
import { MentorChat } from './mentor-chat'

export function MentorShell() {
  const [conversaId, setConversaId] = useState<string | null>(null)
  const lista = trpc.mentor.listar.useQuery()
  const utils = trpc.useUtils()

  const criar = trpc.mentor.criar.useMutation({
    onSuccess: async (c) => {
      await utils.mentor.listar.invalidate()
      setConversaId(c.id)
    },
    onError: (e) => toast.error(e.message ?? 'Falha ao criar conversa'),
  })

  const excluir = trpc.mentor.excluir.useMutation({
    onSuccess: async () => {
      await utils.mentor.listar.invalidate()
      toast.success('Conversa excluída')
    },
    onError: (e) => toast.error(e.message ?? 'Falha ao excluir'),
  })

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <Button onClick={() => criar.mutate({})} loading={criar.isPending} className="w-full">
          <MessageSquarePlus className="size-4" />
          Nova conversa
        </Button>

        {lista.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !lista.data || lista.data.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2">
            Nenhuma conversa ainda. Crie uma para começar.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {lista.data.map((c) => {
              const ativo = c.id === conversaId
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setConversaId(c.id)}
                    className={cn(
                      'flex w-full items-start justify-between gap-2 rounded-md border p-2.5 text-left transition-colors',
                      ativo ? 'border-primary bg-primary/5' : 'hover:border-primary/50',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.titulo}</div>
                      <div className="text-xs text-muted-foreground">
                        {c._count.mensagens} {c._count.mensagens === 1 ? 'mensagem' : 'mensagens'}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Excluir conversa"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Excluir esta conversa?')) {
                          excluir.mutate({ conversaId: c.id })
                          if (ativo) setConversaId(null)
                        }
                      }}
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      <Card className="flex h-[70vh] flex-col p-0 overflow-hidden">
        {conversaId ? (
          <MentorChat conversaId={conversaId} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground p-8">
            <div>
              <p className="mb-2">Selecione uma conversa ao lado ou crie uma nova.</p>
              <p className="text-xs">
                Sugestão: pergunte algo como “Resumo do tratamento de IAMCSST” ou “Como me preparar
                para a reta final?”.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
