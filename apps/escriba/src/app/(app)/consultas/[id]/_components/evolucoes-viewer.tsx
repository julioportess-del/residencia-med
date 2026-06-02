'use client'

import { useMemo, useState, useTransition } from 'react'
import { Check, ClipboardCopy, Pencil, ShieldCheck, X } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { MODELO_EVOLUCAO_LABEL } from '@/lib/rotulos'
import { salvarEvolucaoEditada, marcarConsultaRevisada } from '@/server/actions'

type Modelo = 'SOAP' | 'CORRIDA' | 'UBS'

export interface EvolucaoItem {
  id: string
  modelo: Modelo
  textoGerado: string
  textoEditado: string | null
}

interface EvolucoesViewerProps {
  consultaId: string
  evolucoes: EvolucaoItem[]
  revisado: boolean
}

const ORDEM: Modelo[] = ['SOAP', 'CORRIDA', 'UBS']

export function EvolucoesViewer({ consultaId, evolucoes, revisado }: EvolucoesViewerProps) {
  const ordenadas = useMemo(
    () => [...evolucoes].sort((a, b) => ORDEM.indexOf(a.modelo) - ORDEM.indexOf(b.modelo)),
    [evolucoes],
  )

  const [ativo, setAtivo] = useState<Modelo>(ordenadas[0]?.modelo ?? 'SOAP')
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [estaRevisado, setEstaRevisado] = useState(revisado)
  const [salvando, iniciarSalvar] = useTransition()
  const [revisando, iniciarRevisar] = useTransition()

  // Versão editada local por evolução (otimista após salvar).
  const [editadosLocais, setEditadosLocais] = useState<Record<string, string>>({})

  const atual: EvolucaoItem | undefined =
    ordenadas.find((e) => e.modelo === ativo) ?? ordenadas[0]
  if (!atual) return null
  const evolucaoAtual = atual

  const textoAtual =
    editadosLocais[evolucaoAtual.id] ?? evolucaoAtual.textoEditado ?? evolucaoAtual.textoGerado

  function trocarAba(modelo: Modelo) {
    if (editando) return
    setAtivo(modelo)
    setCopiado(false)
    setErro(null)
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoAtual)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setErro('Não foi possível copiar. Selecione e copie manualmente.')
    }
  }

  function abrirEdicao() {
    setRascunho(textoAtual)
    setEditando(true)
    setErro(null)
  }

  function cancelarEdicao() {
    setEditando(false)
    setRascunho('')
    setErro(null)
  }

  function salvar() {
    const evolucaoId = evolucaoAtual.id
    iniciarSalvar(async () => {
      const res = await salvarEvolucaoEditada(evolucaoId, rascunho)
      if (res.ok) {
        setEditadosLocais((m) => ({ ...m, [evolucaoId]: rascunho.trim() }))
        setEditando(false)
        setErro(null)
      } else {
        setErro(res.erro)
      }
    })
  }

  function marcarRevisado() {
    iniciarRevisar(async () => {
      const res = await marcarConsultaRevisada(consultaId)
      if (res.ok) {
        setEstaRevisado(true)
        setErro(null)
      } else {
        setErro(res.erro)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Abas de formato */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {ordenadas.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => trocarAba(e.modelo)}
            disabled={editando && e.modelo !== ativo}
            className={
              e.modelo === ativo
                ? 'flex-1 rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm'
                : 'flex-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40'
            }
          >
            {MODELO_EVOLUCAO_LABEL[e.modelo] ?? e.modelo}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {editando ? (
        <textarea
          value={rascunho}
          onChange={(ev) => setRascunho(ev.target.value)}
          rows={18}
          className="w-full resize-y rounded-lg border border-input bg-background p-4 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : (
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-4 font-sans text-sm leading-relaxed text-foreground">
          {textoAtual}
        </pre>
      )}

      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-2">
        {editando ? (
          <>
            <Button onClick={salvar} disabled={salvando}>
              <Check className="h-4 w-4" />
              {salvando ? 'Salvando…' : 'Salvar edição'}
            </Button>
            <Button variant="ghost" onClick={cancelarEdicao} disabled={salvando}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={copiar}>
              {copiado ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
              {copiado ? 'Copiado' : 'Copiar'}
            </Button>
            <Button variant="outline" onClick={abrirEdicao}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <div className="ml-auto">
              {estaRevisado ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                  <ShieldCheck className="h-4 w-4" />
                  Revisado
                </span>
              ) : (
                <Button onClick={marcarRevisado} disabled={revisando}>
                  <ShieldCheck className="h-4 w-4" />
                  {revisando ? 'Confirmando…' : 'Marcar como revisado'}
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {!estaRevisado ? (
        <p className="text-xs text-muted-foreground">
          Conteúdo gerado por IA a partir da transcrição. Revise e edite antes de usar no
          prontuário — CID e condutas são sugestões.
        </p>
      ) : null}
    </div>
  )
}
