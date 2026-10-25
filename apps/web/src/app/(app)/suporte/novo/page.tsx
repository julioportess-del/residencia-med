import { NovoTicketForm } from './_components/novo-ticket-form'

export const metadata = { title: 'Novo ticket' }

export default function NovoTicketPage() {
  return (
    <div className="container mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-3xl font-bold">Novo ticket</h1>
      <p className="mt-2 text-muted-foreground">
        Descreva o que aconteceu — vamos retornar por aqui e por email.
      </p>
      <NovoTicketForm />
    </div>
  )
}
