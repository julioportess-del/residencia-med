'use client'

import { useState } from 'react'
import { FileText, LayoutList, Sparkles, Stethoscope } from 'lucide-react'
import type { EstruturaClinica, TipoDocumento } from '@residencia-med/ai/clinico'
import { EvolucoesViewer, type EvolucaoItem } from './evolucoes-viewer'
import { DocumentosPanel } from './documentos-panel'
import { SecoesViewer } from './secoes-viewer'
import { RevisaoIA } from './revisao-ia'
import { AssistenteChatCaso } from '@/components/assistente-consulta'

type Aba = 'prontuario' | 'secoes' | 'documentos' | 'assistente'

interface ConsultaConteudoProps {
  consultaId: string
  evolucoes: EvolucaoItem[]
  revisado: boolean
  documentosDisponiveis: TipoDocumento[]
  estrutura: EstruturaClinica | null
}

const ESTILO_ATIVO =
  '-mb-px flex items-center gap-1.5 border-b-2 border-primary px-1 pb-2.5 text-sm font-medium'
const ESTILO_INATIVO =
  '-mb-px flex items-center gap-1.5 border-b-2 border-transparent px-1 pb-2.5 text-sm text-muted-foreground hover:text-foreground'

export function ConsultaConteudo({
  consultaId,
  evolucoes,
  revisado,
  documentosDisponiveis,
  estrutura,
}: ConsultaConteudoProps) {
  const [aba, setAba] = useState<Aba>('prontuario')

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap gap-x-4 gap-y-1 border-b border-border">
        <button
          type="button"
          onClick={() => setAba('prontuario')}
          className={aba === 'prontuario' ? ESTILO_ATIVO : ESTILO_INATIVO}
        >
          <Stethoscope className="h-4 w-4" />
          Prontuário
        </button>
        {estrutura ? (
          <button
            type="button"
            onClick={() => setAba('secoes')}
            className={aba === 'secoes' ? ESTILO_ATIVO : ESTILO_INATIVO}
          >
            <LayoutList className="h-4 w-4" />
            Seções
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setAba('documentos')}
          className={aba === 'documentos' ? ESTILO_ATIVO : ESTILO_INATIVO}
        >
          <FileText className="h-4 w-4" />
          Documentos
        </button>
        <button
          type="button"
          onClick={() => setAba('assistente')}
          className={aba === 'assistente' ? ESTILO_ATIVO : ESTILO_INATIVO}
        >
          <Sparkles className="h-4 w-4" />
          Assistente
        </button>
      </nav>

      {aba === 'prontuario' ? (
        <>
          <EvolucoesViewer consultaId={consultaId} evolucoes={evolucoes} revisado={revisado} />
          {estrutura ? (
            <div className="border-t border-border pt-4">
              <RevisaoIA consultaId={consultaId} />
            </div>
          ) : null}
        </>
      ) : aba === 'secoes' && estrutura ? (
        <SecoesViewer estrutura={estrutura} />
      ) : aba === 'assistente' ? (
        <AssistenteChatCaso consultaId={consultaId} />
      ) : (
        <DocumentosPanel consultaId={consultaId} disponiveis={documentosDisponiveis} />
      )}
    </div>
  )
}
