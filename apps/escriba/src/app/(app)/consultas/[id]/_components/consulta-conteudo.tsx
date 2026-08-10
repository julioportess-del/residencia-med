'use client'

import { useState } from 'react'
import { FileText, LayoutList, Stethoscope } from 'lucide-react'
import type { EstruturaClinica, TipoDocumento } from '@residencia-med/ai/clinico'
import { EvolucoesViewer, type EvolucaoItem } from './evolucoes-viewer'
import { DocumentosPanel } from './documentos-panel'
import { SecoesViewer } from './secoes-viewer'

type Aba = 'prontuario' | 'secoes' | 'documentos'

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
      <nav className="flex gap-4 border-b border-border">
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
      </nav>

      {aba === 'prontuario' ? (
        <EvolucoesViewer consultaId={consultaId} evolucoes={evolucoes} revisado={revisado} />
      ) : aba === 'secoes' && estrutura ? (
        <SecoesViewer estrutura={estrutura} />
      ) : (
        <DocumentosPanel consultaId={consultaId} disponiveis={documentosDisponiveis} />
      )}
    </div>
  )
}
