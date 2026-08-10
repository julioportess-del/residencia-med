'use client'

import { useRef, useState } from 'react'
import { ChevronDown, Loader2, Send, Sparkles } from 'lucide-react'

/**
 * Assistente IA embutido na consulta — recolhido por padrão para não
 * disputar atenção com o paciente. Usa a transcrição/evolução/dados do
 * paciente como contexto (montado no servidor via consultaId).
 * Conversa efêmera: nada é persistido.
 */

interface Mensagem {
  papel: 'user' | 'assistant'
  conteudo: string
}

const SUGESTOES = [
  'Quais diagnósticos diferenciais devo considerar?',
  'Quais informações importantes ainda não perguntei?',
  'Há interação entre as medicações mencionadas?',
  'Resuma os achados desta consulta.',
]

export function AssistenteConsulta({ consultaId }: { consultaId: string }) {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  async function enviar(pergunta: string) {
    const conteudo = pergunta.trim()
    if (!conteudo || carregando) return
    setErro(null)
    setTexto('')
    const novas: Mensagem[] = [...mensagens, { papel: 'user', conteudo }]
    setMensagens(novas)
    setCarregando(true)
    try {
      const resp = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagens: novas, consultaId }),
      })
      const dados = (await resp.json().catch(() => null)) as
        | { ok: true; resposta: string }
        | { ok: false; erro: string }
        | null
      if (!resp.ok || !dados || dados.ok === false) {
        setErro((dados && 'erro' in dados && dados.erro) || 'Falha ao consultar o assistente.')
        setMensagens(mensagens)
        return
      }
      setMensagens([...novas, { papel: 'assistant', conteudo: dados.resposta }])
      setTimeout(() => listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight }), 50)
    } catch {
      setErro('Falha de rede. Tente novamente.')
      setMensagens(mensagens)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/40"
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Assistente
          <span className="text-xs font-normal text-muted-foreground">
            tire dúvidas sobre este atendimento
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {aberto ? (
        <div className="space-y-3 border-t border-border p-4">
          {mensagens.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  disabled={carregando}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div ref={listaRef} className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {mensagens.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.papel === 'user'
                      ? 'ml-8 rounded-lg bg-primary/10 px-3 py-2 text-sm'
                      : 'mr-4 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm leading-relaxed'
                  }
                >
                  {m.conteudo}
                </div>
              ))}
              {carregando ? (
                <div className="mr-4 inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Pensando…
                </div>
              ) : null}
            </div>
          )}

          {erro ? (
            <p role="alert" className="text-sm text-destructive">
              {erro}
            </p>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void enviar(texto)
            }}
            className="flex gap-2"
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Pergunte sobre este atendimento…"
              className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={carregando || !texto.trim()}
              aria-label="Enviar pergunta"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="text-xs text-muted-foreground">
            Apoio à decisão com base na transcrição e no prontuário. A conversa não é salva.
          </p>
        </div>
      ) : null}
    </div>
  )
}
