import Link from 'next/link'
import { Plus } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { listarModelos } from '@/server/modelos'
import { Button } from '@residencia-med/ui'
import { ModelosLista } from './_components/modelos-lista'

export const dynamic = 'force-dynamic'

export default async function ModelosPage() {
  const user = await exigirUsuario()
  const modelos = await listarModelos(user.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Modelos</h1>
          <p className="text-sm text-muted-foreground">
            Templates que guiam a IA na estruturação. Use os da plataforma ou crie os seus.
          </p>
        </div>
        <Link href="/modelos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Criar modelo
          </Button>
        </Link>
      </div>

      <ModelosLista modelos={modelos} />
    </div>
  )
}
