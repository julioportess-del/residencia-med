'use client'

import { useEffect, useState } from 'react'
import { User2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

type Campos = {
  cpf: string
  whatsapp: string
  instagram: string
  tiktok: string
  cep: string
  cidade: string
  uf: string
  rua: string
  numero: string
  bairro: string
  complemento: string
}

const VAZIO: Campos = {
  cpf: '',
  whatsapp: '',
  instagram: '',
  tiktok: '',
  cep: '',
  cidade: '',
  uf: '',
  rua: '',
  numero: '',
  bairro: '',
  complemento: '',
}

export function PerfilEstendidoSection() {
  const dados = trpc.conta.perfilEstendido.useQuery()
  const utils = trpc.useUtils()
  const salvar = trpc.conta.atualizarPerfilEstendido.useMutation({
    onSuccess: () => {
      toast.success('Perfil atualizado.')
      utils.conta.perfilEstendido.invalidate()
    },
    onError: (e) => toast.error(e.message ?? 'Erro ao salvar'),
  })

  const [form, setForm] = useState<Campos>(VAZIO)

  useEffect(() => {
    if (dados.data) {
      setForm({
        cpf: dados.data.cpf ?? '',
        whatsapp: dados.data.whatsapp ?? '',
        instagram: dados.data.instagram ?? '',
        tiktok: dados.data.tiktok ?? '',
        cep: dados.data.cep ?? '',
        cidade: dados.data.cidade ?? '',
        uf: dados.data.uf ?? '',
        rua: dados.data.rua ?? '',
        numero: dados.data.numero ?? '',
        bairro: dados.data.bairro ?? '',
        complemento: dados.data.complemento ?? '',
      })
    }
  }, [dados.data])

  if (dados.isLoading) return <Skeleton className="h-80" />

  return (
    <Card id="perfil-estendido">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User2 className="size-4" />
          Dados de contato e endereço
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            salvar.mutate({
              cpf: form.cpf.trim() || null,
              whatsapp: form.whatsapp.trim() || null,
              instagram: form.instagram.trim() || null,
              tiktok: form.tiktok.trim() || null,
              cep: form.cep.trim() || null,
              cidade: form.cidade.trim() || null,
              uf: form.uf.trim() || null,
              rua: form.rua.trim() || null,
              numero: form.numero.trim() || null,
              bairro: form.bairro.trim() || null,
              complemento: form.complemento.trim() || null,
            })
          }}
        >
          <Campo label="CPF" valor={form.cpf} onChange={(v) => setForm({ ...form, cpf: v })} />
          <Campo
            label="WhatsApp"
            valor={form.whatsapp}
            onChange={(v) => setForm({ ...form, whatsapp: v })}
          />
          <Campo
            label="Instagram"
            valor={form.instagram}
            onChange={(v) => setForm({ ...form, instagram: v })}
          />
          <Campo
            label="TikTok"
            valor={form.tiktok}
            onChange={(v) => setForm({ ...form, tiktok: v })}
          />
          <Campo label="CEP" valor={form.cep} onChange={(v) => setForm({ ...form, cep: v })} />
          <Campo
            label="Cidade"
            valor={form.cidade}
            onChange={(v) => setForm({ ...form, cidade: v })}
          />
          <Campo
            label="UF"
            valor={form.uf}
            onChange={(v) => setForm({ ...form, uf: v.toUpperCase().slice(0, 2) })}
          />
          <Campo label="Rua" valor={form.rua} onChange={(v) => setForm({ ...form, rua: v })} />
          <Campo
            label="Número"
            valor={form.numero}
            onChange={(v) => setForm({ ...form, numero: v })}
          />
          <Campo
            label="Bairro"
            valor={form.bairro}
            onChange={(v) => setForm({ ...form, bairro: v })}
          />
          <div className="sm:col-span-2">
            <Campo
              label="Complemento"
              valor={form.complemento}
              onChange={(v) => setForm({ ...form, complemento: v })}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={salvar.isPending}>
              Atualizar informações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Campo({
  label,
  valor,
  onChange,
}: {
  label: string
  valor: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="mt-1" value={valor} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
