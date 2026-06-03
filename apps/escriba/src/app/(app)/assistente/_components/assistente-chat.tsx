'use client'

import { useRef, useState, useEffect } from 'react'
import { Loader2, SendHorizonal, Stethoscope, Trash2 } from 'lucide-react'
import { Button } from '@residencia-med/ui'

type Papel = 'user' | 'assistant'

interface Mensagem {
  papel: Papel
  conteudo: string
}

const SUGESTOES = [
  'Primeira linha para hipertensão em diabético com TFG 50?',
  'Quando encaminhar cefaleia da APS para neuro?',
  'Posologia de amoxicilina para ITU não complicada na gestante?',
]

export function AssistenteChat() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [entrada, setEntrada] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, carregando])

  async function enviar(texto: string) {
    const pergunta = texto.trim()
    if (!pergunta || carregando) return
    setErro(null)

    const historico: Mensagem[] = [...mensagens, { papel: 'user', conteudo: pergunta }]
    setMensagens(historico)
    setEntrada('')
    setCarregando(true)

    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagens: historico }),
      })
      const dados = await res.json()
      if (dados.ok) {
        setMensagens((m) => [...m, { papel: 'assistant', conteudo: dados.resposta }])
      } else {
        setErro(dados.erro ?? 'Falha ao consultar o assistente.')
      }
    } catch {
      setErro('Sem conexão com o assistente. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  function limpar() {
    setMensagens([])
    setErro(null)
  }

  const vazio = mensagens.length === 0

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {vazio ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Stethoscope className="h-6 w-6" />
            </span>
            <div>
              <p className="font-medium">Assistente de apoio à decisão clínica</p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Tire dúvidas de conduta, posologia e encaminhamento, baseadas em diretrizes. Não
                inclua dados que identifiquem o paciente.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="rounded-lg border border-border px-4 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensagens.map((m, i) => (
            <div key={i} className={m.papel === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.papel === 'user'
                    ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground'
                    : 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm leading-relaxed'
                }
              >
                {m.conteudo}
              </div>
            </div>
          ))
        )}

        {carregando ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Consultando diretrizes…
            </div>
          </div>
        ) : null}

        <div ref={fimRef} />
      </div>

      {erro ? (
        <p role="alert" className="pb-2 text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          enviar(entrada)
        }}
        className="flex items-end gap-2 border-t border-border pt-4"
      >
        <textarea
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              enviar(entrada)
            }
          }}
          rows={1}
          placeholder="Pergunte sobre conduta, posologia, encaminhamento…"
          className="max-h-32 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        />
        {!vazio ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={limpar}
            title="Limpar conversa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
        <Button type="submit" size="icon" disabled={carregando || !entrada.trim()}>
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>

      <p className="pt-2 text-xs text-muted-foreground">
        Apoio à decisão — não substitui seu julgamento clínico. Conversas não são salvas.
      </p>
    </div>
  )
}
