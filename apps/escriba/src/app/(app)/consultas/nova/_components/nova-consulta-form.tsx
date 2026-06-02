'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { TIPO_CONSULTA_LABEL } from '@/lib/rotulos'
import { TIPO_CONSULTA_VALORES, novaConsultaSchema } from '@/lib/validacao'
import { criarConsulta } from '@/server/actions'

export function NovaConsultaForm() {
  const router = useRouter()
  const [pendente, iniciarTransicao] = useTransition()
  const [iniciais, setIniciais] = useState('')
  const [tipo, setTipo] = useState<(typeof TIPO_CONSULTA_VALORES)[number]>('DEMANDA_ESPONTANEA')
  const [consentimento, setConsentimento] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)

    const analise = novaConsultaSchema.safeParse({
      pacienteIniciais: iniciais,
      tipoConsulta: tipo,
      consentimentoConfirmado: consentimento,
    })
    if (!analise.success) {
      setErro(analise.error.issues[0]?.message ?? 'Verifique os campos.')
      return
    }

    iniciarTransicao(async () => {
      const resultado = await criarConsulta(analise.data)
      if (!resultado.ok) {
        setErro(resultado.erro)
        return
      }
      router.replace(`/consultas/${resultado.id}/gravar`)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="iniciais">Iniciais do paciente</Label>
        <Input
          id="iniciais"
          value={iniciais}
          onChange={(e) => setIniciais(e.target.value)}
          placeholder="Ex.: J.S."
          autoComplete="off"
          maxLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">
          Não registre nome completo, CPF ou outros dados que identifiquem o paciente.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tipo">Tipo de consulta</Label>
        <Select
          id="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as typeof tipo)}
        >
          {TIPO_CONSULTA_VALORES.map((valor) => (
            <option key={valor} value={valor}>
              {TIPO_CONSULTA_LABEL[valor]}
            </option>
          ))}
        </Select>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-muted/40 p-3.5">
        <input
          type="checkbox"
          checked={consentimento}
          onChange={(e) => setConsentimento(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary"
        />
        <span className="flex items-start gap-2 text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="text-foreground">
            Informei o paciente sobre a gravação e o uso para apoio ao prontuário, e ele consentiu.
          </span>
        </span>
      </label>

      {erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" loading={pendente}>
        Iniciar consulta
      </Button>
    </form>
  )
}
