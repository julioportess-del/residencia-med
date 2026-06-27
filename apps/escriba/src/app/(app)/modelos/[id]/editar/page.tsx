import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterModelo } from '@/server/modelos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModeloForm, type ModeloInicial } from '../../_components/modelo-form'
import type { TipoDocModelo, FormatoEvolucao } from '@/lib/validacao'

export const dynamic = 'force-dynamic'

export default async function EditarModeloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await exigirUsuario()
  const m = await obterModelo(user.id, id)
  if (!m) notFound()
  // Modelos da plataforma não são editáveis — duplique para personalizar.
  if (!m.isProprio) redirect(`/modelos/${id}`)

  const inicial: ModeloInicial = {
    nome: m.nome,
    especialidade: m.especialidade ?? '',
    tipoDocumento: m.tipoDocumento as TipoDocModelo,
    formatoBase: m.formatoBase as FormatoEvolucao,
    instrucoes: m.instrucoes,
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/modelos/${m.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {m.nome}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Editar modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <ModeloForm modeloId={m.id} inicial={inicial} />
        </CardContent>
      </Card>
    </div>
  )
}
