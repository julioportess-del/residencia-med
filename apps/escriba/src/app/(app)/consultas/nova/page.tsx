import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NovaConsultaForm } from './_components/nova-consulta-form'

export const dynamic = 'force-dynamic'

export default async function NovaConsultaPage() {
  await exigirUsuario()

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
          <NovaConsultaForm />
        </CardContent>
      </Card>
    </div>
  )
}
