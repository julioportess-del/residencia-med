import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { prismaClinico } from '@residencia-med/db-clinico'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import {
  estruturaClinicaSchema,
  documentosDisponiveis,
  type TipoDocumento,
} from '@residencia-med/ai/clinico'
import { TIPO_CONSULTA_LABEL, STATUS_CONSULTA_LABEL } from '@/lib/rotulos'
import { type EvolucaoItem } from './_components/evolucoes-viewer'
import { ConsultaConteudo } from './_components/consulta-conteudo'
import { ProcessandoPoll } from './_components/processando-poll'

export const dynamic = 'force-dynamic'

type Modelo = 'SOAP' | 'CORRIDA' | 'UBS'

export default async function ConsultaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await exigirUsuario()

  const consulta = await prismaClinico.consulta.findFirst({
    where: { id, usuarioAuthId: user.id, excluidoEm: null },
    include: {
      evolucoes: {
        select: {
          id: true,
          modelo: true,
          textoGerado: true,
          textoEditado: true,
          dadosEstruturados: true,
        },
      },
    },
  })
  if (!consulta) notFound()
  if (consulta.status === 'GRAVANDO') redirect(`/consultas/${consulta.id}/gravar`)

  const processando = consulta.status === 'TRANSCREVENDO' || consulta.status === 'ESTRUTURANDO'
  const evolucoes: EvolucaoItem[] = consulta.evolucoes.map((e) => ({
    id: e.id,
    modelo: e.modelo as Modelo,
    textoGerado: e.textoGerado,
    textoEditado: e.textoEditado,
  }))

  // Documentos derivados disponíveis a partir da estrutura clínica persistida.
  const estruturaParse = estruturaClinicaSchema.safeParse(
    consulta.evolucoes.find((e) => e.dadosEstruturados)?.dadosEstruturados,
  )
  const docsDisponiveis: TipoDocumento[] = estruturaParse.success
    ? documentosDisponiveis(estruturaParse.data)
    : []

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/consultas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            {consulta.pacienteIniciais} ·{' '}
            {TIPO_CONSULTA_LABEL[consulta.tipoConsulta] ?? consulta.tipoConsulta}
          </CardTitle>
          <StatusBadge status={consulta.status} />
        </CardHeader>
        <CardContent>
          {processando ? (
            <ProcessandoPoll rotulo={STATUS_CONSULTA_LABEL[consulta.status] ?? 'Processando'} />
          ) : evolucoes.length > 0 ? (
            <ConsultaConteudo
              consultaId={consulta.id}
              evolucoes={evolucoes}
              revisado={consulta.status === 'REVISADO'}
              documentosDisponiveis={docsDisponiveis}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma evolução foi gerada. Volte e grave novamente a consulta.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
