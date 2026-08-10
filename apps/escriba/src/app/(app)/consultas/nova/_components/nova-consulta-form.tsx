'use client'

import { useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { TIPO_CONSULTA_LABEL } from '@/lib/rotulos'
import { TIPO_CONSULTA_VALORES, novaConsultaSchema } from '@/lib/validacao'
import { criarConsulta } from '@/server/actions'

interface PacienteOpcao {
  id: string
  nomeCompleto: string
}

interface ModeloOpcao {
  id: string
  nome: string
  especialidade: string | null
  isPadrao: boolean
}

interface NovaConsultaFormProps {
  cadastroAtivo: boolean
  pacientes: PacienteOpcao[]
  preSelecionadoId?: string
  modelos: ModeloOpcao[]
  preModeloId?: string
}

export function NovaConsultaForm({
  cadastroAtivo,
  pacientes,
  preSelecionadoId,
  modelos,
  preModeloId,
}: NovaConsultaFormProps) {
  const router = useRouter()
  const [pendente, iniciarTransicao] = useTransition()
  const [pacienteId, setPacienteId] = useState(preSelecionadoId ?? '')
  const [modeloId, setModeloId] = useState(preModeloId ?? '')
  const [iniciais, setIniciais] = useState('')
  const [tipo, setTipo] = useState<(typeof TIPO_CONSULTA_VALORES)[number]>('DEMANDA_ESPONTANEA')
  const [consentimento, setConsentimento] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Quando há paciente vinculado, as iniciais derivam do nome cadastrado.
  const usandoPaciente = cadastroAtivo && pacienteId !== ''

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)

    const nomePaciente = usandoPaciente
      ? (pacientes.find((p) => p.id === pacienteId)?.nomeCompleto ?? '')
      : iniciais

    const analise = novaConsultaSchema.safeParse({
      pacienteIniciais: nomePaciente,
      tipoConsulta: tipo,
      consentimentoConfirmado: consentimento,
      ...(usandoPaciente ? { pacienteId } : {}),
      ...(modeloId ? { modeloId } : {}),
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
      {cadastroAtivo ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="paciente">Paciente</Label>
            <Link
              href="/pacientes/novo"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Cadastrar novo
            </Link>
          </div>
          <Select id="paciente" value={pacienteId} onChange={(e) => setPacienteId(e.target.value)}>
            <option value="">Digitar nome/iniciais (sem cadastro)</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nomeCompleto}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {!usandoPaciente ? (
        <div className="space-y-1.5">
          <Label htmlFor="iniciais">Nome do paciente</Label>
          <Input
            id="iniciais"
            value={iniciais}
            onChange={(e) => setIniciais(e.target.value)}
            placeholder="Ex.: Maria Silva (ou apenas iniciais)"
            autoComplete="off"
            maxLength={120}
            required
          />
          <p className="text-xs text-muted-foreground">
            Nome completo ou iniciais. Não registre CPF, RG ou outros números. Os dados ficam
            visíveis apenas para você.
          </p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="tipo">Tipo de consulta</Label>
        <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
          {TIPO_CONSULTA_VALORES.map((valor) => (
            <option key={valor} value={valor}>
              {TIPO_CONSULTA_LABEL[valor]}
            </option>
          ))}
        </Select>
      </div>

      {modelos.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="modelo">Modelo do prontuário</Label>
          <Select id="modelo" value={modeloId} onChange={(e) => setModeloId(e.target.value)}>
            <option value="">Automático — recomendado</option>
            {modelos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
                {m.especialidade ? ` · ${m.especialidade}` : ''}
                {m.isPadrao ? ' ★ favorito' : ''}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            No automático, o Escriba usa seu modelo favorito ou identifica a estrutura pela
            especialidade. Você pode trocar depois.
          </p>
        </div>
      ) : null}

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

      {erro ? <Alert variant="destructive">{erro}</Alert> : null}

      <Button type="submit" size="lg" className="w-full" loading={pendente}>
        Iniciar consulta
      </Button>
    </form>
  )
}
