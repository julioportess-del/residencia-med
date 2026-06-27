'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, Play, Star } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { duplicarModelo } from '@/server/actions'
import { TIPO_DOC_MODELO_LABEL } from '@/lib/rotulos'
import type { ModeloResumo } from '@/server/modelos'

export function ModelosLista({ modelos }: { modelos: ModeloResumo[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [tipo, setTipo] = useState('')
  const [duplicando, iniciar] = useTransition()

  const especialidades = useMemo(
    () =>
      Array.from(new Set(modelos.map((m) => m.especialidade).filter(Boolean) as string[])).sort(),
    [modelos],
  )
  const tipos = useMemo(() => Array.from(new Set(modelos.map((m) => m.tipoDocumento))), [modelos])

  const filtrados = modelos.filter((m) => {
    if (especialidade && m.especialidade !== especialidade) return false
    if (tipo && m.tipoDocumento !== tipo) return false
    if (busca && !m.nome.toLowerCase().includes(busca.toLowerCase().trim())) return false
    return true
  })

  function duplicar(id: string) {
    iniciar(async () => {
      const res = await duplicarModelo(id)
      if (res.ok) {
        router.push(`/modelos/${res.id}/editar`)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar modelo…"
          aria-label="Buscar modelo"
        />
        <Select
          value={especialidade}
          onChange={(e) => setEspecialidade(e.target.value)}
          aria-label="Especialidade"
        >
          <option value="">Todas as especialidades</option>
          {especialidades.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
        <Select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo">
          <option value="">Todos os tipos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {TIPO_DOC_MODELO_LABEL[t] ?? t}
            </option>
          ))}
        </Select>
      </div>

      {filtrados.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nenhum modelo encontrado para esses filtros.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtrados.map((m) => (
            <li
              key={m.id}
              className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-2">
                <Link href={`/modelos/${m.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium hover:underline">{m.nome}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[m.especialidade, TIPO_DOC_MODELO_LABEL[m.tipoDocumento]]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </Link>
                {m.isPadrao ? (
                  <Badge variant="default">
                    <Star className="mr-1 h-3 w-3" />
                    Padrão
                  </Badge>
                ) : null}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {m.isProprio ? 'Você' : 'Plataforma'} · {m.usosCount} uso(s)
                </span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicar(m.id)}
                    disabled={duplicando}
                    title="Duplicar"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Link href={`/consultas/nova?modelo=${m.id}`}>
                    <Button size="sm">
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      Usar
                    </Button>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
