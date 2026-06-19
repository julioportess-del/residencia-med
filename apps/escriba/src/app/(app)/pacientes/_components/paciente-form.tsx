'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, X, Plus } from 'lucide-react'
import { Button } from '@residencia-med/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { criarPaciente, atualizarPaciente } from '@/server/actions'
import { pacienteSchema, type PacienteInput } from '@/lib/validacao'

export interface PacienteInicial {
  nomeCompleto: string
  dataNascimento: string // YYYY-MM-DD ou ''
  cpf: string
  email: string
  telefone: string
  endereco: string
  alergias: string[]
  medicamentos: string[]
  condicoesCronicas: string[]
  antecedentes: string
}

const VAZIO: PacienteInicial = {
  nomeCompleto: '',
  dataNascimento: '',
  cpf: '',
  email: '',
  telefone: '',
  endereco: '',
  alergias: [],
  medicamentos: [],
  condicoesCronicas: [],
  antecedentes: '',
}

interface PacienteFormProps {
  /** Quando presente, edita; senão, cria. */
  pacienteId?: string
  inicial?: PacienteInicial
}

function ListaChips({
  rotulo,
  itens,
  onMudar,
  placeholder,
}: {
  rotulo: string
  itens: string[]
  onMudar: (v: string[]) => void
  placeholder: string
}) {
  const [texto, setTexto] = useState('')
  function adicionar() {
    const t = texto.trim()
    if (t && !itens.includes(t)) onMudar([...itens, t])
    setTexto('')
  }
  return (
    <div className="space-y-1.5">
      <Label>{rotulo}</Label>
      {itens.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {itens.map((i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs"
            >
              {i}
              <button
                type="button"
                aria-label={`Remover ${i}`}
                onClick={() => onMudar(itens.filter((x) => x !== i))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              adicionar()
            }
          }}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={adicionar}
          aria-label="Adicionar"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function PacienteForm({ pacienteId, inicial }: PacienteFormProps) {
  const router = useRouter()
  const novo = !pacienteId
  const [d, setD] = useState<PacienteInicial>(inicial ?? VAZIO)
  const [consentimento, setConsentimento] = useState(!novo)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  function campo<K extends keyof PacienteInicial>(k: K, v: PacienteInicial[K]) {
    setD((atual) => ({ ...atual, [k]: v }))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)

    const payload: PacienteInput = { ...d, consentimentoCadastro: consentimento }
    const analise = pacienteSchema.safeParse(payload)
    if (!analise.success) {
      setErro(analise.error.issues[0]?.message ?? 'Verifique os campos.')
      return
    }
    if (novo && !consentimento) {
      setErro('Confirme o consentimento do paciente para registrar os dados.')
      return
    }

    iniciar(async () => {
      if (pacienteId) {
        const res = await atualizarPaciente(pacienteId, analise.data)
        if (!res.ok) {
          setErro(res.erro)
          return
        }
        router.replace(`/pacientes/${pacienteId}`)
      } else {
        const res = await criarPaciente(analise.data)
        if (!res.ok) {
          setErro(res.erro)
          return
        }
        router.replace(`/pacientes/${res.id}`)
      }
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input
          id="nome"
          value={d.nomeCompleto}
          onChange={(e) => campo('nomeCompleto', e.target.value)}
          maxLength={120}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nascimento">Data de nascimento</Label>
          <Input
            id="nascimento"
            type="date"
            value={d.dataNascimento}
            onChange={(e) => campo('dataNascimento', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            value={d.cpf}
            onChange={(e) => campo('cpf', e.target.value)}
            inputMode="numeric"
            maxLength={14}
            placeholder="Opcional"
          />
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            Dado sensível. Registre apenas com base legal/consentimento.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={d.email}
            onChange={(e) => campo('email', e.target.value)}
            placeholder="Opcional"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={d.telefone}
            onChange={(e) => campo('telefone', e.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          value={d.endereco}
          onChange={(e) => campo('endereco', e.target.value)}
          maxLength={200}
          placeholder="Opcional"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ListaChips
          rotulo="Alergias"
          itens={d.alergias}
          onMudar={(v) => campo('alergias', v)}
          placeholder="ex.: Dipirona"
        />
        <ListaChips
          rotulo="Medicamentos em uso"
          itens={d.medicamentos}
          onMudar={(v) => campo('medicamentos', v)}
          placeholder="ex.: Losartana 50mg"
        />
        <ListaChips
          rotulo="Condições crônicas"
          itens={d.condicoesCronicas}
          onMudar={(v) => campo('condicoesCronicas', v)}
          placeholder="ex.: HAS"
        />
        <div className="space-y-1.5">
          <Label htmlFor="antecedentes">Antecedentes familiares</Label>
          <textarea
            id="antecedentes"
            value={d.antecedentes}
            onChange={(e) => campo('antecedentes', e.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full rounded-md border border-input bg-background p-3 text-sm"
            placeholder="Opcional"
          />
        </div>
      </div>

      {novo ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-muted/40 p-3.5">
          <input
            type="checkbox"
            checked={consentimento}
            onChange={(e) => setConsentimento(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary"
          />
          <span className="text-sm">
            O paciente foi informado e <strong>consentiu</strong> com o registro destes dados para
            fins de prontuário.
          </span>
        </label>
      ) : null}

      {erro ? <Alert variant="destructive">{erro}</Alert> : null}

      <div className="flex gap-3">
        <Button type="submit" size="lg" loading={pendente}>
          {pacienteId ? 'Salvar alterações' : 'Cadastrar paciente'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
