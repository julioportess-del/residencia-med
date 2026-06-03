import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'

interface AuthShellProps {
  titulo: string
  subtitulo?: string
  children: React.ReactNode
  rodape?: React.ReactNode
}

/** Layout compartilhado das telas de autenticação (login, cadastro, senha). */
export function AuthShell({ titulo, subtitulo, children, rodape }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-4">
        <Brand />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
            {subtitulo ? <p className="text-sm text-muted-foreground">{subtitulo}</p> : null}
          </div>
          {children}
          {rodape ? (
            <div className="text-center text-sm text-muted-foreground">{rodape}</div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
