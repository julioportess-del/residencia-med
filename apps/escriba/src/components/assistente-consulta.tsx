'use client'

import { useRef, useState } from 'react'
import { ChevronDown, Loader2, Paperclip, Send, Sparkles } from 'lucide-react'
import { useAnexosUpload } from '@/components/anexos/use-anexos-upload'
import { AnexosChips } from '@/components/anexos/anexos-chips'
import { EXTENSOES_ACEITAS } from '@/lib/anexos-tipos'

/**
 * Assistente IA do caso — usa a transcrição/evolução/dados do paciente
 * como contexto (montado no servidor via consultaId) e aceita anexos
 * (PDFs de exames, fotos, laudos) que a IA lê para apoiar a conduta.
 * Conversa efêmera: nada é persistido além dos anexos (vinculados à
 * consulta, com retenção de 24h).
 *
 * `AssistenteChatCaso`: o chat em si (usado como ABA no final da consulta).
 * `AssistenteConsulta`: versão recolhível (usada na tela de gravação).
 */

interface AnexoExibido {
  nome: string
}

interface Mensagem {
  papel: 'user' | 'assistant'
  conteudo: string
  anexos?: AnexoExibido[]
}

const SUGESTOES = [
  'Quais diagnósticos diferenciais devo considerar?',
  'Quais informações importantes ainda não perguntei?',
  'Há interação entre as medicações mencionadas?',
  'Resuma os achados desta consulta.',
]

export function AssistenteChatCaso({ consultaId }: { consultaId: string }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)
  const inputArquivoRef = useRef<HTMLInputElement>(null)
  // Anexos vinculados a esta consulta (upload direto ao storage privado).
  const anexos = useAnexosUpload({ consultaId })

  async function enviar(pergunta: string) {
    const conteudo = pergunta.trim()
    if (!conteudo || carregando || anexos.enviando) return
    setErro(null)
    setTexto('')

    const doTurno = anexos.prontos
    const anexoIds = doTurno.map((a) => a.anexoId).filter((x): x is string => Boolean(x))

    const novas: Mensagem[] = [
      ...mensagens,
      { papel: 'user', conteudo, anexos: doTurno.map((a) => ({ nome: a.nome })) },
    ]
    setMensagens(novas)
    anexos.limpar()
    setAnalisando(anexoIds.length > 0)
    setCarregando(true)
    try {
      const resp = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagens: novas.map((m) => ({ papel: m.papel, conteudo: m.conteudo })),
          anexoIds,
          consultaId,
        }),
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
      setAnalisando(false)
    }
  }

  return (
    <div className="space-y-3">
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
              {m.anexos && m.anexos.length > 0 ? (
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {m.anexos.map((a) => (
                    <span
                      key={a.nome}
                      className="inline-flex items-center gap-1 rounded bg-background/60 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                    >
                      <Paperclip className="h-3 w-3" />
                      {a.nome}
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
          ))}
          {carregando ? (
            <div className="mr-4 inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {analisando ? 'Lendo os anexos…' : 'Pensando…'}
            </div>
          ) : null}
        </div>
      )}

      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      {/* Anexos do turno atual (aguardando envio junto com a pergunta) */}
      {anexos.lista.length > 0 ? (
        <AnexosChips lista={anexos.lista} onRemover={anexos.remover} />
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void enviar(texto)
        }}
        className="flex gap-2"
      >
        <input
          ref={inputArquivoRef}
          type="file"
          multiple
          accept={EXTENSOES_ACEITAS}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) anexos.adicionar(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputArquivoRef.current?.click()}
          disabled={carregando}
          aria-label="Anexar exame, foto ou PDF"
          title="Anexar exame, foto ou PDF"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={
            anexos.prontos.length > 0
              ? 'Pergunte sobre os anexos e o caso…'
              : 'Pergunte sobre este atendimento…'
          }
          className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={carregando || anexos.enviando || !texto.trim()}
          aria-label="Enviar pergunta"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          {anexos.enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
      <p className="text-xs text-muted-foreground">
        Anexe exames em PDF, fotos e laudos — a IA lê o conteúdo e cruza com a consulta. Apoio à
        decisão; a conversa não é salva.
      </p>
    </div>
  )
}

/** Versão recolhível — usada na tela de gravação para não disputar atenção. */
export function AssistenteConsulta({ consultaId }: { consultaId: string }) {
  const [aberto, setAberto] = useState(false)

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
            tire dúvidas · anexe exames
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {aberto ? (
        <div className="border-t border-border p-4">
          <AssistenteChatCaso consultaId={consultaId} />
        </div>
      ) : null}
    </div>
  )
}
