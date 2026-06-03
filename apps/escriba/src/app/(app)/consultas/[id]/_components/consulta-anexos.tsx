'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Paperclip, FileText, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { useAnexosUpload } from '@/components/anexos/use-anexos-upload'
import { AnexosChips } from '@/components/anexos/anexos-chips'
import { EXTENSOES_ACEITAS, type StatusAnexoTipo } from '@/lib/anexos-tipos'

export interface AnexoHistorico {
  id: string
  nomeArquivo: string
  tipoMime: string
  status: StatusAnexoTipo
  resumoAnalise: string | null
}

interface ConsultaAnexosProps {
  consultaId: string
  anexosIniciais: AnexoHistorico[]
}

const STATUS_ROTULO: Record<StatusAnexoTipo, string> = {
  ENVIADO: 'Enviado',
  PROCESSANDO: 'Processando',
  ANALISADO: 'Analisado',
  ERRO: 'Erro',
}

export function ConsultaAnexos({ consultaId, anexosIniciais }: ConsultaAnexosProps) {
  const router = useRouter()
  const anexos = useAnexosUpload({ consultaId })
  const [pergunta, setPergunta] = useState('')
  const [analisando, setAnalisando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [respostaAtual, setRespostaAtual] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function analisar() {
    const texto = pergunta.trim()
    if (!texto || analisando || anexos.enviando) return
    const anexoIds = anexos.prontos.map((a) => a.anexoId).filter((x): x is string => Boolean(x))
    if (anexoIds.length === 0) {
      setErro('Anexe ao menos um exame ou imagem.')
      return
    }
    setErro(null)
    setAnalisando(true)
    setRespostaAtual(null)
    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagens: [{ papel: 'user', conteudo: texto }],
          anexoIds,
          consultaId,
        }),
      })
      const dados = await res.json()
      if (dados.ok) {
        setRespostaAtual(dados.resposta)
        setPergunta('')
        anexos.limpar()
        router.refresh() // atualiza o histórico (status/resumo persistidos)
      } else {
        setErro(dados.erro ?? 'Falha ao analisar os anexos.')
      }
    } catch {
      setErro('Sem conexão. Tente novamente.')
    } finally {
      setAnalisando(false)
    }
  }

  function aoSelecionar(files: FileList | null) {
    if (files && files.length > 0) anexos.adicionar(files)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Histórico de anexos já analisados nesta consulta */}
      {anexosIniciais.length > 0 ? (
        <ul className="space-y-2">
          {anexosIniciais.map((a) => {
            const aberto = expandido === a.id
            return (
              <li key={a.id} className="rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setExpandido(aberto ? null : a.id)}
                  disabled={!a.resumoAnalise}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm disabled:cursor-default"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{a.nomeArquivo}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {STATUS_ROTULO[a.status]}
                  </span>
                  {a.resumoAnalise ? (
                    aberto ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )
                  ) : null}
                </button>
                {aberto && a.resumoAnalise ? (
                  <div className="whitespace-pre-wrap border-t border-border px-3 py-2.5 text-sm leading-relaxed">
                    {a.resumoAnalise}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}

      {/* Resposta da análise recém-feita */}
      {respostaAtual ? (
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed">
          {respostaAtual}
        </div>
      ) : null}

      {/* Anexar + perguntar */}
      <div className="space-y-2">
        <AnexosChips lista={anexos.lista} onRemover={anexos.remover} />
        <div className="flex items-end gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={EXTENSOES_ACEITAS}
            className="hidden"
            onChange={(e) => aoSelecionar(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => inputRef.current?.click()}
            title="Anexar exames ou imagens"
            aria-label="Anexar exames ou imagens"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            rows={1}
            placeholder="Pergunte sobre os exames anexados…"
            className="max-h-32 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
          <Button
            type="button"
            onClick={analisar}
            disabled={analisando || anexos.enviando || !pergunta.trim()}
          >
            {analisando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analisar'}
          </Button>
        </div>
        {erro ? (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Anexos ficam criptografados e são excluídos automaticamente em 24h. Apoio à decisão — não
          substitui seu julgamento clínico.
        </p>
      </div>
    </div>
  )
}
