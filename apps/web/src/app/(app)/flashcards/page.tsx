import { FlashcardsPainel } from './_components/flashcards-painel'

export const metadata = { title: 'Flashcards' }

export default function FlashcardsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Flashcards</h1>
      <p className="mt-2 text-muted-foreground">
        Repetição espaçada com FSRS: cada cartão volta no momento em que você está prestes a
        esquecer (meta de 90% de lembrança).
      </p>
      <FlashcardsPainel />
    </div>
  )
}
