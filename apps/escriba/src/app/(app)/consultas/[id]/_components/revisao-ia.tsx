'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, ScanSearch } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Badge, type BadgeVariant } from '@/components/ui/badge'

/**
 * "Revisar consulta com IA": aponta lacunas de documentação na evolução
 * (medicamento sem dose, contradições, alergia não registrada…). Apoio à
 * documentação — a decisão continua sendo do médico.
 */

interface Apontamento {
  categoria: string
  descricao: string
  gravidade: 'ALTA' | 'MEDIA' | 'BAIXA'
}

const GRAVIDADE_VARIANTE: Record<string, BadgeVariant> = {
  ALTA: 'destructive',
  MEDIA: 'warning',
  BAIXA: 'secondary',
}

const GRAVIDADE_LABEL: Record<string, string> = {
  ALTA: 'Atenção',
  MEDIA: 'Revisar',
  BAIXA: 'Sugestão',
}

type EstadoRevisao = 'ocioso' | 'carregando' | 'pronto' | 'erro'

export function RevisaoIA({ consultaId }: { consultaId: string }) {
  const [estado, setEstado] = useState<EstadoRevisao>('ocioso')
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([])
  const [erro, setErro] = useState<string | null>(null)

  async function revisar() {
    setEstado('carregando')
    setErro(null)
    try {
      const resp = await fetch(`/api/consultas/${consultaId}/revisar`, { method: 'POST' })
      const dados = (await resp.json().catch(() => null)) as
        | { ok: true; revisao: { apontamentos: Apontamento[] } }
        | { ok: false; erro: string }
        | null
      if (!resp.ok || !dados || dados.ok === false) {
        setErro((dados && 'erro' in dados && dados.erro) || 'Falha ao revisar. Tente novamente.')
        setEstado('erro')
        return
      }
      setApontamentos(dados.revisao.apontamentos)
      setEstado('pronto')
    } catch {
      setErro('Falha de rede. Tente novamente.')
      setEstado('erro')
    }
  }

  if (estado === 'ocioso' || estado === 'erro') {
    return (
      <div className="space-y-2">
        <Button variant="outline" onClick={revisar}>
          <ScanSearch className="h-4 w-4" />
          Revisar consulta com IA
        </Button>
        {erro ? (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        ) : null}
      </div>
    )
  }

  if (estado === 'carregando') {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Conferindo a documentação…
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {apontamentos.length === 0 ? (
        <p className="inline-flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          Nenhuma lacuna de documentação encontrada.
        </p>
      ) : (
        <ul className="space-y-2">
          {apontamentos.map((a, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <Badge variant={GRAVIDADE_VARIANTE[a.gravidade] ?? 'secondary'}>
                {GRAVIDADE_LABEL[a.gravidade] ?? a.gravidade}
              </Badge>
              <span className="text-sm leading-relaxed">{a.descricao}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={revisar}>
          Revisar de novo
        </Button>
        <p className="text-xs text-muted-foreground">
          Apoio à documentação — a decisão clínica é sua.
        </p>
      </div>
    </div>
  )
}
