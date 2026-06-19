import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterPaciente } from '@/server/pacientes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PacienteForm, type PacienteInicial } from '../../_components/paciente-form'

export const dynamic = 'force-dynamic'

export default async function EditarPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await exigirUsuario()
  const p = await obterPaciente(user.id, id)
  if (!p) notFound()

  const inicial: PacienteInicial = {
    nomeCompleto: p.nomeCompleto,
    dataNascimento: p.dataNascimento ? p.dataNascimento.toISOString().slice(0, 10) : '',
    cpf: p.cpf ?? '',
    email: p.email ?? '',
    telefone: p.telefone ?? '',
    endereco: p.endereco ?? '',
    alergias: p.alergias,
    medicamentos: p.medicamentos,
    condicoesCronicas: p.condicoesCronicas,
    antecedentes: p.antecedentes ?? '',
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/pacientes/${p.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {p.nomeCompleto}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Editar paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <PacienteForm pacienteId={p.id} inicial={inicial} />
        </CardContent>
      </Card>
    </div>
  )
}
