import { LiveShell } from './_components/live-shell'

export const metadata = { title: 'Simulados ao vivo' }

export default function LivePage() {
  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-bold">Simulados ao vivo</h1>
      <p className="mt-2 text-muted-foreground">
        Competições em tempo real com leaderboard. Crie uma sala (admin de organização) ou entre
        com um código.
      </p>
      <LiveShell />
    </div>
  )
}
