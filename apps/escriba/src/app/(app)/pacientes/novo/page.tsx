import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterPreferencias } from '@/server/preferencias'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PacienteForm } from '../_components/paciente-form'

export const dynamic = 'force-dynamic'

export default async function NovoPacientePage() {
  const user = await exigirUsuario()
  const pref = await obterPreferencias(user.id)
  if (!pref.cadastroPacientesAtivo) redirect('/pacientes')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Pacientes
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Novo paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <PacienteForm />
        </CardContent>
      </Card>
    </div>
  )
}
