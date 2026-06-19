import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterPreferencias } from '@/server/preferencias'
import { listarPacientes } from '@/server/pacientes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NovaConsultaForm } from './_components/nova-consulta-form'

export const dynamic = 'force-dynamic'

export default async function NovaConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string }>
}) {
  const user = await exigirUsuario()
  const pref = await obterPreferencias(user.id)
  const { paciente: pacienteParam } = await searchParams

  let pacientes: { id: string; nomeCompleto: string }[] = []
  if (pref.cadastroPacientesAtivo) {
    const lista = await listarPacientes(user.id)
    pacientes = lista.map((p) => ({ id: p.id, nomeCompleto: p.nomeCompleto }))
  }
  const preSelecionadoId = pacientes.some((p) => p.id === pacienteParam) ? pacienteParam : undefined

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/consultas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nova consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <NovaConsultaForm
            cadastroAtivo={pref.cadastroPacientesAtivo}
            pacientes={pacientes}
            preSelecionadoId={preSelecionadoId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
