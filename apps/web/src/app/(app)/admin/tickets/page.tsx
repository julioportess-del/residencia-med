import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { exigirAdmin } from '@/lib/auth'
import { TicketsAdmin } from './_components/tickets-admin'

export const metadata = { title: 'Suporte — Admin' }

export default async function AdminTicketsPage() {
  await exigirAdmin()
  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Painel admin
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Suporte</h1>
      <p className="mt-2 text-muted-foreground">
        Fila de tickets abertos pelos usuários. Clique num ticket para responder.
      </p>
      <TicketsAdmin />
    </div>
  )
}
