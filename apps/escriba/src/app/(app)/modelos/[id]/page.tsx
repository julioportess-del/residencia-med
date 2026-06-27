import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { obterModelo } from '@/server/modelos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TIPO_DOC_MODELO_LABEL, MODELO_EVOLUCAO_LABEL } from '@/lib/rotulos'
import { ModeloAcoes } from './_components/modelo-acoes'

export const dynamic = 'force-dynamic'

export default async function ModeloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await exigirUsuario()
  const m = await obterModelo(user.id, id)
  if (!m) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/modelos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Modelos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{m.nome}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {m.especialidade ? <Badge variant="secondary">{m.especialidade}</Badge> : null}
            <Badge variant="outline">
              {TIPO_DOC_MODELO_LABEL[m.tipoDocumento] ?? m.tipoDocumento}
            </Badge>
            <Badge variant="outline">
              Formato: {MODELO_EVOLUCAO_LABEL[m.formatoBase] ?? m.formatoBase}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {m.isProprio ? 'Seu modelo' : 'Plataforma'} · {m.usosCount} uso(s)
            </span>
          </div>
        </div>
      </div>

      <ModeloAcoes modeloId={m.id} isProprio={m.isProprio} isPadrao={m.isPadrao} />

      <Card>
        <CardHeader>
          <CardTitle>Instruções para a IA</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.instrucoes}</p>
        </CardContent>
      </Card>
    </div>
  )
}
