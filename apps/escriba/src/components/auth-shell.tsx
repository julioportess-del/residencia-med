import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandPanel } from '@/components/auth/brand-panel'

interface AuthShellProps {
  titulo: string
  subtitulo?: string
  children: React.ReactNode
  rodape?: React.ReactNode
}

/**
 * Layout split-screen das telas de autenticação (login, cadastro, senha).
 * Esquerda: painel institucional (desktop). Direita: card de ação.
 */
export function AuthShell({ titulo, subtitulo, children, rodape }: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.2fr_1fr]">
      <BrandPanel />

      <div className="flex flex-col">
        <header className="flex items-center justify-between p-4 lg:px-8">
          {/* marca aparece no topo só no mobile (no desktop ela está no painel) */}
          <span className="lg:invisible">
            <Brand />
          </span>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-2 sm:px-8">
          <div className="animate-fade-in-up w-full max-w-sm space-y-6">
            <div className="space-y-1.5 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
              {subtitulo ? <p className="text-sm text-muted-foreground">{subtitulo}</p> : null}
            </div>

            <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-xl shadow-black/[0.03] backdrop-blur-sm sm:p-7">
              {children}
            </div>

            {rodape ? (
              <div className="text-center text-sm text-muted-foreground">{rodape}</div>
            ) : null}

            <p className="text-center text-xs text-muted-foreground/70">
              Ambiente médico protegido · LGPD · Dados criptografados
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
