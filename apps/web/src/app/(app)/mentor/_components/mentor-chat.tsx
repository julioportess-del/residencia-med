'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/cn'

type MensagemLocal = {
  id: string
  papel: 'USUARIO' | 'ASSISTENTE'
  conteudo: string
  pendente?: boolean
}

export function MentorChat({ conversaId }: { conversaId: string }) {
  const detalhe = trpc.mentor.detalhe.useQuery({ conversaId })
  const utils = trpc.useUtils()

  const [pergunta, setPergunta] = useState('')
  const [streaming, setStreaming] = useState<MensagemLocal | null>(null)
  const [enviando, setEnviando] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)

  const mensagens = detalhe.data?.mensagens ?? []
  const mostrar: MensagemLocal[] = mensagens.map((m) => ({
    id: m.id,
    papel: m.papel as 'USUARIO' | 'ASSISTENTE',
    conteudo: m.conteudo,
  }))
  if (streaming) mostrar.push(streaming)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mostrar.length, streaming?.conteudo.length])

  const enviar = async () => {
    const texto = pergunta.trim()
    if (!texto || enviando) return
    setEnviando(true)
    setPergunta('')

    // Otimista: mostra mensagem do usuário imediatamente
    setStreaming({ id: 'streaming-temp', papel: 'ASSISTENTE', conteudo: '', pendente: true })

    try {
      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversaId, mensagem: texto }),
      })
      if (!res.ok || !res.body) {
        const erro = await res.json().catch(() => ({ error: 'Erro' }))
        throw new Error(erro.error ?? `HTTP ${res.status}`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acumulado = ''
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acumulado += decoder.decode(value, { stream: true })
        setStreaming({ id: 'streaming-temp', papel: 'ASSISTENTE', conteudo: acumulado, pendente: true })
      }
      // Stream completo: invalida query para puxar do banco
      await utils.mentor.detalhe.invalidate({ conversaId })
      await utils.mentor.listar.invalidate()
      setStreaming(null)
    } catch (e) {
      toast.error((e as Error).message ?? 'Falha ao enviar')
      setStreaming(null)
    } finally {
      setEnviando(false)
    }
  }

  if (detalhe.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-12 w-1/2 self-end" />
        <Skeleton className="h-24 w-3/4" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {mostrar.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Faça sua primeira pergunta abaixo.
          </div>
        ) : (
          <div className="space-y-4">
            {mostrar.map((m) => (
              <Mensagem key={m.id} m={m} />
            ))}
            <div ref={fimRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void enviar()
        }}
        className="border-t bg-background p-4"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void enviar()
              }
            }}
            rows={2}
            placeholder="Pergunte algo clínico ou peça ajuda de estudo..."
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={enviando}
          />
          <Button type="submit" loading={enviando} disabled={!pergunta.trim() || enviando}>
            <Send className="size-4" />
            Enviar
          </Button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Conteúdo gerado por IA. Sempre confirme com a diretriz citada antes de aplicar clinicamente.
        </p>
      </form>
    </div>
  )
}

function Mensagem({ m }: { m: MensagemLocal }) {
  const ehUsuario = m.papel === 'USUARIO'
  return (
    <div className={cn('flex gap-3', ehUsuario && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          ehUsuario ? 'bg-secondary text-secondary-foreground' : 'bg-primary/10 text-primary',
        )}
      >
        {ehUsuario ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2.5 text-sm',
          ehUsuario ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        <Conteudo texto={m.conteudo} />
        {m.pendente && !m.conteudo && <span className="opacity-50">Pensando...</span>}
        {m.pendente && m.conteudo && <span className="ml-1 inline-block size-2 animate-pulse rounded-full bg-current" />}
      </div>
    </div>
  )
}

function Conteudo({ texto }: { texto: string }) {
  // Renderizador minimalista: trata cabeçalhos e listas
  const blocos = texto.split(/\n\n+/)
  return (
    <>
      {blocos.map((b, i) => {
        const t = b.trim()
        if (t.startsWith('## ')) return <h3 key={i} className="font-semibold mt-2 first:mt-0">{t.slice(3)}</h3>
        if (t.startsWith('### ')) return <h4 key={i} className="font-semibold text-xs mt-2 first:mt-0">{t.slice(4)}</h4>
        if (t.startsWith('- ')) {
          return (
            <ul key={i} className="list-disc pl-4 my-1 space-y-0.5">
              {t.split('\n').map((l, j) => (
                <li key={j}>{l.replace(/^- /, '')}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="my-1 first:mt-0 last:mb-0 whitespace-pre-line">
            {t}
          </p>
        )
      })}
    </>
  )
}
