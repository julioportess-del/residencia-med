'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Sparkles, Stethoscope } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificacoesSino } from '@/components/notificacoes-sino'
import { RegistrarSW } from '@/components/registrar-sw'
import { SafeBoundary } from '@/components/safe-boundary'
import { NAV, itemAtivo } from './nav-itens'
import { NavMobile } from './nav-mobile'

type Props = {
  user: { nome: string; email: string }
  onboardingCompleto: boolean
  children: ReactNode
}

export function AppShell({ user, onboardingCompleto, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const naoEhOnboarding = !pathname.startsWith('/onboarding')

  async function sair() {
    await supabaseBrowser().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      <SafeBoundary name="registrar-sw">
        <RegistrarSW />
      </SafeBoundary>
      <aside className="hidden w-60 shrink-0 border-r md:flex md:flex-col">
        <Link href="/dashboard" className="flex items-center gap-2 px-6 py-5 border-b">
          <Stethoscope className="size-5 text-primary" />
          <span className="font-bold">Residência Med</span>
        </Link>

        <nav className="flex-1 px-3 py-4">
          {NAV.map((item) => {
            const ativo = itemAtivo(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  ativo
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t px-3 py-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {(user.nome[0] ?? 'U').toUpperCase()}
              </div>
              <div className="text-xs min-w-0">
                <div className="font-medium leading-tight truncate">{user.nome}</div>
                <div className="truncate text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <SafeBoundary name="notificacoes-sino">
              <NotificacoesSino />
            </SafeBoundary>
            <button
              type="button"
              onClick={sair}
              aria-label="Sair"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
          <ThemeToggle compacto />
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-2.5 backdrop-blur md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Stethoscope className="size-5 text-primary" />
            <span className="font-bold">Residência Med</span>
          </Link>
          <SafeBoundary name="notificacoes-sino-mobile">
            <NotificacoesSino />
          </SafeBoundary>
        </header>
        {!onboardingCompleto && naoEhOnboarding ? (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-900 flex items-center gap-2">
            <Sparkles className="size-4" />
            Complete o onboarding para gerar seu plano personalizado.{' '}
            <Link href="/onboarding" className="underline font-medium">
              Continuar
            </Link>
          </div>
        ) : null}
        {children}
      </main>
      <NavMobile nome={user.nome} email={user.email} onSair={sair} />
    </div>
  )
}
