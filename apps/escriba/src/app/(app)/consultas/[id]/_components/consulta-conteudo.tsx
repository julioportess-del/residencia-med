'use client'

import { useState } from 'react'
import { FileText, Stethoscope } from 'lucide-react'
import type { TipoDocumento } from '@residencia-med/ai/clinico'
import { EvolucoesViewer, type EvolucaoItem } from './evolucoes-viewer'
import { DocumentosPanel } from './documentos-panel'

type Aba = 'evolucao' | 'documentos'

interface ConsultaConteudoProps {
  consultaId: string
  evolucoes: EvolucaoItem[]
  revisado: boolean
  documentosDisponiveis: TipoDocumento[]
}

export function ConsultaConteudo({
  consultaId,
  evolucoes,
  revisado,
  documentosDisponiveis,
}: ConsultaConteudoProps) {
  const [aba, setAba] = useState<Aba>('evolucao')

  return (
    <div className="space-y-5">
      <nav className="flex gap-4 border-b border-border">
        <button
          type="button"
          onClick={() => setAba('evolucao')}
          className={
            aba === 'evolucao'
              ? '-mb-px flex items-center gap-1.5 border-b-2 border-primary px-1 pb-2.5 text-sm font-medium'
              : '-mb-px flex items-center gap-1.5 border-b-2 border-transparent px-1 pb-2.5 text-sm text-muted-foreground hover:text-foreground'
          }
        >
          <Stethoscope className="h-4 w-4" />
          Evolução
        </button>
        <button
          type="button"
          onClick={() => setAba('documentos')}
          className={
            aba === 'documentos'
              ? '-mb-px flex items-center gap-1.5 border-b-2 border-primary px-1 pb-2.5 text-sm font-medium'
              : '-mb-px flex items-center gap-1.5 border-b-2 border-transparent px-1 pb-2.5 text-sm text-muted-foreground hover:text-foreground'
          }
        >
          <FileText className="h-4 w-4" />
          Documentos
        </button>
      </nav>

      {aba === 'evolucao' ? (
        <EvolucoesViewer consultaId={consultaId} evolucoes={evolucoes} revisado={revisado} />
      ) : (
        <DocumentosPanel consultaId={consultaId} disponiveis={documentosDisponiveis} />
      )}
    </div>
  )
}
