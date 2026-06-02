'use client'

import { useState, useTransition } from 'react'
import { Check, ClipboardCopy, FileText } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import type { TipoDocumento } from '@residencia-med/ai/clinico'
import { gerarDocumento } from '@/server/actions'

const LABEL: Record<TipoDocumento, string> = {
  ATESTADO: 'Atestado médico',
  RECEITA: 'Receituário',
  SOLICITACAO_EXAMES: 'Solicitação de exames',
  ENCAMINHAMENTO: 'Encaminhamento',
  ORIENTACOES_PACIENTE: 'Orientações ao paciente',
  RESUMO_CONSULTA: 'Resumo da consulta',
}

interface DocumentosPanelProps {
  consultaId: string
  disponiveis: TipoDocumento[]
}

export function DocumentosPanel({ consultaId, disponiveis }: DocumentosPanelProps) {
  const [tipo, setTipo] = useState<TipoDocumento | null>(null)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [gerando, iniciarGerar] = useTransition()

  // Opções do atestado
  const [dias, setDias] = useState('')
  const [incluirCid, setIncluirCid] = useState(false)

  function gerar(t: TipoDocumento) {
    setErro(null)
    setCopiado(false)
    setTipo(t)
    const opcoes =
      t === 'ATESTADO'
        ? { dias: dias ? Number(dias) : undefined, incluirCid }
        : undefined
    iniciarGerar(async () => {
      const res = await gerarDocumento(consultaId, t, opcoes)
      if (res.ok) {
        setTexto(res.texto)
      } else {
        setTexto('')
        setErro(res.erro)
      }
    })
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setErro('Não foi possível copiar. Selecione e copie manualmente.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {disponiveis.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => gerar(t)}
            disabled={gerando}
            className={
              tipo === t
                ? 'flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-3 py-2 text-left text-sm font-medium'
                : 'flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground disabled:opacity-50'
            }
          >
            <FileText className="h-4 w-4 shrink-0" />
            {LABEL[t]}
          </button>
        ))}
      </div>

      {tipo === 'ATESTADO' ? (
        <div className="flex flex-wrap items-end gap-3 rounded-lg bg-muted/50 p-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Dias de afastamento</span>
            <input
              type="number"
              min={0}
              max={365}
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              placeholder="ex.: 2"
              className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={incluirCid}
              onChange={(e) => setIncluirCid(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Incluir CID
          </label>
          <Button variant="outline" size="sm" onClick={() => gerar('ATESTADO')} disabled={gerando}>
            Atualizar atestado
          </Button>
        </div>
      ) : null}

      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      {gerando ? (
        <p className="text-sm text-muted-foreground">Gerando documento…</p>
      ) : texto ? (
        <div className="space-y-3">
          <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-4 font-sans text-sm leading-relaxed">
            {texto}
          </pre>
          <Button variant="outline" onClick={copiar}>
            {copiado ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            {copiado ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Selecione um documento para gerar a partir desta consulta.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Documentos são rascunhos gerados da transcrição. Revise, complete dados (CRM, posologia) e
        assine antes de entregar.
      </p>
    </div>
  )
}
