'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { salvarPreferencias } from '@/server/actions'
import { MODELO_EVOLUCAO_LABEL } from '@/lib/rotulos'
import type { PreferenciasMedico } from '@/server/preferencias'

const FORMATOS = ['SOAP', 'CORRIDA', 'UBS'] as const

interface PreferenciasFormProps {
  inicial: PreferenciasMedico
}

export function PreferenciasForm({ inicial }: PreferenciasFormProps) {
  const [especialidade, setEspecialidade] = useState(inicial.especialidade)
  const [instrucoesCustom, setInstrucoesCustom] = useState(inicial.instrucoesCustom)
  const [formatoPadrao, setFormatoPadrao] = useState<PreferenciasMedico['formatoPadrao']>(
    inicial.formatoPadrao,
  )
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)
  const [salvando, iniciarSalvar] = useTransition()

  function salvar() {
    setErro(null)
    setSalvo(false)
    iniciarSalvar(async () => {
      const res = await salvarPreferencias({ especialidade, instrucoesCustom, formatoPadrao })
      if (res.ok) {
        setSalvo(true)
        setTimeout(() => setSalvo(false), 2500)
      } else {
        setErro(res.erro)
      }
    })
  }

  return (
    <div className="space-y-6">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Especialidade</span>
        <span className="block text-xs text-muted-foreground">
          Orienta a IA a usar a terminologia e o foco clínico da sua área.
        </span>
        <input
          type="text"
          value={especialidade}
          onChange={(e) => setEspecialidade(e.target.value)}
          maxLength={80}
          placeholder="ex.: Medicina de Família e Comunidade"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Instruções personalizadas</span>
        <span className="block text-xs text-muted-foreground">
          Regras livres que a IA deve seguir ao montar a evolução (ex.: sempre listar CID,
          detalhar posologia, separar condutas por prioridade).
        </span>
        <textarea
          value={instrucoesCustom}
          onChange={(e) => setInstrucoesCustom(e.target.value)}
          maxLength={1000}
          rows={5}
          placeholder="Descreva como você prefere que a evolução seja estruturada…"
          className="w-full rounded-md border border-input bg-background p-3 text-sm leading-relaxed"
        />
        <span className="block text-right text-xs text-muted-foreground">
          {instrucoesCustom.length}/1000
        </span>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Formato padrão</legend>
        <span className="block text-xs text-muted-foreground">
          Aba aberta por padrão ao visualizar a evolução.
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {FORMATOS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormatoPadrao(f)}
              className={
                formatoPadrao === f
                  ? 'rounded-lg border border-primary bg-primary/5 px-4 py-2 text-sm font-medium'
                  : 'rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }
            >
              {MODELO_EVOLUCAO_LABEL[f] ?? f}
            </button>
          ))}
        </div>
      </fieldset>

      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button onClick={salvar} disabled={salvando}>
          {salvo ? <Check className="h-4 w-4" /> : null}
          {salvando ? 'Salvando…' : salvo ? 'Salvo' : 'Salvar preferências'}
        </Button>
      </div>
    </div>
  )
}
