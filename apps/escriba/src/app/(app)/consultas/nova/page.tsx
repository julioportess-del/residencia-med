import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterPreferencias } from '@/server/preferencias'
import { listarPacientes } from '@/server/pacientes'
import { listarModelos } from '@/server/modelos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NovaConsultaForm } from './_components/nova-consulta-form'

export const dynamic = 'force-dynamic'

export default async function NovaConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string; modelo?: string }>
}) {
  const user = await exigirUsuario()
  const { paciente: pacienteParam, modelo: modeloParam } = await searchParams

  // Uma única rodada de queries em paralelo — corta a latência da página.
  const [pref, listaPacientes, listaModelos] = await Promise.all([
    obterPreferencias(user.id),
    listarPacientes(user.id),
    listarModelos(user.id),
  ])

  const pacientes = pref.cadastroPacientesAtivo
    ? listaPacientes.map((p) => ({ id: p.id, nomeCompleto: p.nomeCompleto }))
    : []
  const preSelecionadoId = pacientes.some((p) => p.id === pacienteParam) ? pacienteParam : undefined
  const modelos = listaModelos.map((m) => ({
    id: m.id,
    nome: m.nome,
    especialidade: m.especialidade,
    isPadrao: m.isPadrao,
  }))
  const padraoId = modelos.find((m) => m.isPadrao)?.id
  const preModeloId = modelos.some((m) => m.id === modeloParam) ? modeloParam : padraoId

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
            modelos={modelos}
            preModeloId={preModeloId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
