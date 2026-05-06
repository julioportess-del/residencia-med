'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  BookOpen,
  Calendar,
  ChartLine,
  CreditCard,
  MessageSquare,
  Repeat2,
  Stethoscope,
  Target,
  Sparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  user: { nome: string; email: string }
  onboardingCompleto: boolean
  children: ReactNode
}

const NAV = [
  { href: '/dashboard', icon: ChartLine, label: 'Painel' },
  { href: '/questoes', icon: BookOpen, label: 'Questões' },
  { href: '/simulado', icon: Target, label: 'Simulado' },
  { href: '/revisao', icon: Repeat2, label: 'Revisão' },
  { href: '/plano', icon: Calendar, label: 'Plano' },
  { href: '/mentor', icon: MessageSquare, label: 'Mentor' },
  { href: '/conta', icon: CreditCard, label: 'Conta' },
] as const

export function AppShell({ user, onboardingCompleto, children }: Props) {
  const pathname = usePathname()
  const naoEhOnboarding = !pathname.startsWith('/onboarding')

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r md:flex md:flex-col">
        <Link href="/dashboard" className="flex items-center gap-2 px-6 py-5 border-b">
          <Stethoscope className="size-5 text-primary" />
          <span className="font-bold">Residência Med</span>
        </Link>

        <nav className="flex-1 px-3 py-4">
          {NAV.map((item) => {
            const ativo = pathname.startsWith(item.href)
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

        <div className="flex items-center gap-3 border-t px-4 py-3">
          <UserButton afterSignOutUrl="/" />
          <div className="text-xs">
            <div className="font-medium leading-tight">{user.nome}</div>
            <div className="truncate text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
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
    </div>
  )
}
