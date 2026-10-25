import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TicketDetalhe } from './_components/ticket-detalhe'

export const metadata = { title: 'Ticket' }

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="container mx-auto max-w-3xl px-6 py-6">
      <Link
        href="/suporte"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Meus tickets
      </Link>
      <TicketDetalhe id={id} />
    </div>
  )
}
