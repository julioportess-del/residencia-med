'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Stethoscope,
  Sparkles,
  BarChart3,
  Settings2,
  Users,
  FileText,
  Menu,
  X,
} from 'lucide-react'
import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { SairButton } from '@/components/sair-button'

interface ItemNav {
  href: string
  rotulo: string
  icone: typeof LayoutDashboard
  emBreve?: boolean
}

const ITENS: ItemNav[] = [
  { href: '/dashboard', rotulo: 'Dashboard', icone: LayoutDashboard },
  { href: '/consultas', rotulo: 'Consultas', icone: Stethoscope },
  { href: '/assistente', rotulo: 'Assistente', icone: Sparkles },
  { href: '/metricas', rotulo: 'Métricas', icone: BarChart3 },
  { href: '/preferencias', rotulo: 'Preferências', icone: Settings2 },
]

const ITENS_FUTUROS: ItemNav[] = [
  { href: '#', rotulo: 'Pacientes', icone: Users, emBreve: true },
  { href: '#', rotulo: 'Modelos', icone: FileText, emBreve: true },
]

function estaAtivo(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function ListaNav({ onNavegar }: { onNavegar?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {ITENS.map((item) => {
        const ativo = estaAtivo(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavegar}
            aria-current={ativo ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              ativo
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <item.icone className="h-4 w-4 shrink-0" />
            {item.rotulo}
          </Link>
        )
      })}

      <p className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
        Em breve
      </p>
      {ITENS_FUTUROS.map((item) => (
        <span
          key={item.rotulo}
          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/50"
        >
          <item.icone className="h-4 w-4 shrink-0" />
          {item.rotulo}
          <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            em breve
          </span>
        </span>
      ))}
    </nav>
  )
}

export function AppNav({ nome }: { nome: string }) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      {/* Sidebar fixa — desktop */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-border bg-card/40 px-3 py-4 lg:flex">
        <Link href="/dashboard" aria-label="Ir para o dashboard" className="px-2 pb-4">
          <Brand />
        </Link>
        <ListaNav />
        <div className="mt-auto space-y-3 border-t border-border pt-3">
          <p className="truncate px-3 text-sm text-muted-foreground" title={nome}>
            {nome}
          </p>
          <div className="flex items-center gap-2 px-1">
            <ThemeToggle />
            <SairButton />
          </div>
        </div>
      </aside>

      {/* Header — mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/dashboard" aria-label="Ir para o dashboard">
          <Brand />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setAberto(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Drawer — mobile */}
      {aberto ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setAberto(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] animate-fade-in-up flex-col border-r border-border bg-card px-3 py-4 shadow-xl">
            <div className="flex items-center justify-between px-2 pb-4">
              <Brand />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setAberto(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ListaNav onNavegar={() => setAberto(false)} />
            <div className="mt-auto space-y-3 border-t border-border pt-3">
              <p className="truncate px-3 text-sm text-muted-foreground">{nome}</p>
              <div className="px-1">
                <SairButton />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
