import { ContribuirShell } from './_components/contribuir-shell'

export const metadata = { title: 'Contribuir' }

export default function ContribuirPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-3xl font-bold">Contribuir com questões</h1>
      <p className="mt-2 text-muted-foreground">
        Estudantes Pro e Premium podem submeter questões de provas reais. Cada submissão passa por
        validação automática com IA e depois revisão humana antes de entrar no banco público.
      </p>
      <ContribuirShell />
    </div>
  )
}
