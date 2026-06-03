import Link from 'next/link'
import { exigirUsuario } from '@/lib/auth'
import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { SairButton } from '@/components/sair-button'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await exigirUsuario()
  const nome =
    (user.user_metadata?.name as string | undefined) ?? user.email.split('@')[0] ?? 'Médico'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/consultas" aria-label="Ir para consultas">
              <Brand />
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/consultas"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Consultas
              </Link>
              <Link
                href="/assistente"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Assistente
              </Link>
              <Link
                href="/metricas"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Métricas
              </Link>
              <Link
                href="/preferencias"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Preferências
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{nome}</span>
            <ThemeToggle />
            <SairButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
