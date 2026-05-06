import { MentorShell } from './_components/mentor-shell'

export const metadata = { title: 'Mentor' }

export default function MentorPage() {
  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-3xl font-bold">Mentor virtual</h1>
      <p className="mt-2 text-muted-foreground">
        Tire dúvidas clínicas, peça ajuda em casos ou estratégia de estudo. O mentor já conhece sua
        banca-alvo, desempenho e pontos fracos.
      </p>
      <MentorShell />
    </div>
  )
}
