import { notFound, redirect } from 'next/navigation'
import { exigirUsuario } from '@/lib/auth'
import { prismaClinico } from '@residencia-med/db-clinico'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GravadorConsulta } from '@/components/gravador-consulta'
import { AssistenteConsulta } from '@/components/assistente-consulta'
import { TIPO_ATENDIMENTO_LABEL } from '@/lib/rotulos'

export const dynamic = 'force-dynamic'

export default async function GravarConsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await exigirUsuario()

  const consulta = await prismaClinico.consulta.findFirst({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    select: {
      id: true,
      pacienteIniciais: true,
      tipoConsulta: true,
      tipoAtendimento: true,
      status: true,
    },
  })
  if (!consulta) notFound()
  if (consulta.status !== 'GRAVANDO') redirect(`/consultas/${consulta.id}`)

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {consulta.pacienteIniciais} ·{' '}
            {TIPO_ATENDIMENTO_LABEL[consulta.tipoAtendimento] ?? 'Consulta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GravadorConsulta consultaId={consulta.id} />
        </CardContent>
      </Card>

      {/* Assistente disponível durante a consulta — recolhido por padrão */}
      <AssistenteConsulta consultaId={consulta.id} />
    </div>
  )
}
