import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TicketsLista } from './_components/tickets-lista'

export const metadata = { title: 'Suporte' }

export default function SuportePage() {
  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Suporte</h1>
          <p className="mt-2 text-muted-foreground">
            Seus tickets abertos com a equipe. Respondemos por aqui.
          </p>
        </div>
        <Link href="/suporte/novo">
          <Button>
            <Plus className="size-4" /> Novo ticket
          </Button>
        </Link>
      </div>
      <TicketsLista />
    </div>
  )
}
