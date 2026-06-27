'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@residencia-med/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { criarModelo, atualizarModelo } from '@/server/actions'
import { modeloSchema, TIPO_DOC_MODELO_VALORES, MODELO_EVOLUCAO_VALORES } from '@/lib/validacao'
import { TIPO_DOC_MODELO_LABEL, MODELO_EVOLUCAO_LABEL } from '@/lib/rotulos'

export interface ModeloInicial {
  nome: string
  especialidade: string
  tipoDocumento: (typeof TIPO_DOC_MODELO_VALORES)[number]
  formatoBase: (typeof MODELO_EVOLUCAO_VALORES)[number]
  instrucoes: string
}

const VAZIO: ModeloInicial = {
  nome: '',
  especialidade: '',
  tipoDocumento: 'EVOLUCAO',
  formatoBase: 'SOAP',
  instrucoes: '',
}

interface ModeloFormProps {
  modeloId?: string
  inicial?: ModeloInicial
}

export function ModeloForm({ modeloId, inicial }: ModeloFormProps) {
  const router = useRouter()
  const [d, setD] = useState<ModeloInicial>(inicial ?? VAZIO)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  function campo<K extends keyof ModeloInicial>(k: K, v: ModeloInicial[K]) {
    setD((atual) => ({ ...atual, [k]: v }))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)
    const analise = modeloSchema.safeParse(d)
    if (!analise.success) {
      setErro(analise.error.issues[0]?.message ?? 'Verifique os campos.')
      return
    }
    iniciar(async () => {
      if (modeloId) {
        const res = await atualizarModelo(modeloId, analise.data)
        if (!res.ok) return setErro(res.erro)
        router.replace(`/modelos/${modeloId}`)
      } else {
        const res = await criarModelo(analise.data)
        if (!res.ok) return setErro(res.erro)
        router.replace(`/modelos/${res.id}`)
      }
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome do modelo</Label>
        <Input
          id="nome"
          value={d.nome}
          onChange={(e) => campo('nome', e.target.value)}
          maxLength={80}
          placeholder="ex.: Cardiologia — retorno"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="especialidade">Especialidade</Label>
          <Input
            id="especialidade"
            value={d.especialidade}
            onChange={(e) => campo('especialidade', e.target.value)}
            maxLength={80}
            placeholder="Opcional"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tipo">Tipo de documento</Label>
          <Select
            id="tipo"
            value={d.tipoDocumento}
            onChange={(e) =>
              campo('tipoDocumento', e.target.value as ModeloInicial['tipoDocumento'])
            }
          >
            {TIPO_DOC_MODELO_VALORES.map((t) => (
              <option key={t} value={t}>
                {TIPO_DOC_MODELO_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Formato base da evolução</Label>
        <div className="flex flex-wrap gap-2">
          {MODELO_EVOLUCAO_VALORES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => campo('formatoBase', f)}
              className={
                d.formatoBase === f
                  ? 'rounded-lg border border-primary bg-primary/5 px-4 py-2 text-sm font-medium'
                  : 'rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }
            >
              {MODELO_EVOLUCAO_LABEL[f] ?? f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="instrucoes">Instruções para a IA</Label>
        <span className="block text-xs text-muted-foreground">
          O que a IA deve enfatizar ao montar a evolução com este modelo.
        </span>
        <textarea
          id="instrucoes"
          value={d.instrucoes}
          onChange={(e) => campo('instrucoes', e.target.value)}
          maxLength={2000}
          rows={6}
          className="w-full rounded-md border border-input bg-background p-3 text-sm leading-relaxed"
          placeholder="ex.: Foque em risco cardiovascular, pressão arterial, ausculta e ajuste de terapêutica…"
          required
        />
        <span className="block text-right text-xs text-muted-foreground">
          {d.instrucoes.length}/2000
        </span>
      </div>

      {erro ? <Alert variant="destructive">{erro}</Alert> : null}

      <div className="flex gap-3">
        <Button type="submit" size="lg" loading={pendente}>
          {modeloId ? 'Salvar alterações' : 'Criar modelo'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
