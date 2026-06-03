'use client'

import { useRef, useState, useEffect } from 'react'
import { Loader2, SendHorizonal, Stethoscope, Trash2, Paperclip, FileText } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { useAnexosUpload } from '@/components/anexos/use-anexos-upload'
import { AnexosChips } from '@/components/anexos/anexos-chips'
import { EXTENSOES_ACEITAS } from '@/lib/anexos-tipos'

type Papel = 'user' | 'assistant'

interface AnexoExibido {
  nome: string
  tipoMime: string
}

interface Mensagem {
  papel: Papel
  conteudo: string
  anexos?: AnexoExibido[]
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
  const [analisando, setAnalisando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)
  const inputArquivoRef = useRef<HTMLInputElement>(null)
  const anexos = useAnexosUpload()

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, carregando])

  async function enviar(texto: string) {
    const pergunta = texto.trim()
    if (!pergunta || carregando || anexos.enviando) return
    setErro(null)

    const doTurno = anexos.prontos
    const anexoIds = doTurno.map((a) => a.anexoId).filter((x): x is string => Boolean(x))
    const tinhaAnexos = anexoIds.length > 0

    const msgUsuario: Mensagem = {
      papel: 'user',
      conteudo: pergunta,
      anexos: doTurno.map((a) => ({ nome: a.nome, tipoMime: a.tipoMime })),
    }
    const historico: Mensagem[] = [...mensagens, msgUsuario]
    setMensagens(historico)
    setEntrada('')
    anexos.limpar()
    setAnalisando(tinhaAnexos)
    setCarregando(true)

    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagens: historico.map((m) => ({ papel: m.papel, conteudo: m.conteudo })),
          anexoIds,
        }),
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
      setAnalisando(false)
    }
  }

  function aoSelecionarArquivos(files: FileList | null) {
    if (files && files.length > 0) anexos.adicionar(files)
    if (inputArquivoRef.current) inputArquivoRef.current.value = ''
  }

  function limpar() {
    setMensagens([])
    setErro(null)
    anexos.limpar()
  }

  const vazio = mensagens.length === 0

  return (
    <div
      className="relative flex h-[calc(100vh-12rem)] flex-col"
      onDragOver={(e) => {
        e.preventDefault()
        setArrastando(true)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setArrastando(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setArrastando(false)
        aoSelecionarArquivos(e.dataTransfer.files)
      }}
    >
      {arrastando ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/5 text-sm font-medium text-primary">
          Solte os exames/imagens aqui
        </div>
      ) : null}

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {vazio ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Stethoscope className="h-6 w-6" />
            </span>
            <div>
              <p className="font-medium">Copiloto clínico de apoio à decisão</p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Tire dúvidas de conduta, posologia e encaminhamento — ou anexe exames e imagens para
                uma análise contextualizada. Não inclua dados que identifiquem o paciente.
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
                {m.anexos && m.anexos.length > 0 ? (
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    {m.anexos.map((a, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 rounded bg-primary-foreground/15 px-1.5 py-0.5 text-xs"
                      >
                        <FileText className="h-3 w-3" />
                        <span className="max-w-[8rem] truncate">{a.nome}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
                {m.conteudo}
              </div>
            </div>
          ))
        )}

        {carregando ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {analisando ? 'Analisando anexos…' : 'Consultando diretrizes…'}
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

      <div className="border-t border-border pt-4">
        <AnexosChips lista={anexos.lista} onRemover={anexos.remover} />

        <form
          onSubmit={(e) => {
            e.preventDefault()
            enviar(entrada)
          }}
          className="flex items-end gap-2"
        >
          <input
            ref={inputArquivoRef}
            type="file"
            multiple
            accept={EXTENSOES_ACEITAS}
            className="hidden"
            onChange={(e) => aoSelecionarArquivos(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => inputArquivoRef.current?.click()}
            title="Anexar exames ou imagens"
            aria-label="Anexar exames ou imagens"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

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
            placeholder={
              anexos.lista.length > 0
                ? 'Pergunte sobre os anexos…'
                : 'Pergunte sobre conduta, posologia, encaminhamento…'
            }
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
          <Button
            type="submit"
            size="icon"
            disabled={carregando || anexos.enviando || !entrada.trim()}
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <p className="pt-2 text-xs text-muted-foreground">
        Apoio à decisão — não substitui seu julgamento clínico. Conversas não são salvas; anexos
        ficam criptografados e são excluídos automaticamente em 24h.
      </p>
    </div>
  )
}
