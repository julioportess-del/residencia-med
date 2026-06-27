import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModeloForm } from '../_components/modelo-form'

export const dynamic = 'force-dynamic'

export default async function NovoModeloPage() {
  await exigirUsuario()
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/modelos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Modelos
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Novo modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <ModeloForm />
        </CardContent>
      </Card>
    </div>
  )
}
