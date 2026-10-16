'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV, itemAtivo } from './nav-itens'

type Props = { nome: string; email: string; onSair: () => void }

/** Barra inferior fixa no celular (< md) + painel "Mais" com o restante. */
export function NavMobile({ nome, email, onSair }: Props) {
  const pathname = usePathname()
  const [maisAberto, setMaisAberto] = useState(false)
  const principais = NAV.filter((i) => i.principal)
  const secundarios = NAV.filter((i) => !i.principal)
  const algumSecundarioAtivo = secundarios.some((i) => itemAtivo(pathname, i.href))

  useEffect(() => setMaisAberto(false), [pathname])

  return (
    <>
      {maisAberto && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mais opções"
        >
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMaisAberto(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t bg-background p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="min-w-0 text-sm">
                <div className="truncate font-medium">{nome}</div>
                <div className="truncate text-xs text-muted-foreground">{email}</div>
              </div>
              <ThemeToggle compacto />
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {secundarios.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-3 text-sm font-medium',
                      itemAtivo(pathname, item.href) && 'border-primary bg-primary/5 text-primary',
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={onSair}
                  className="flex w-full items-center gap-2 rounded-lg border p-3 text-sm font-medium text-muted-foreground"
                >
                  <LogOut className="size-4" /> Sair
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {principais.map((item) => {
            const ativo = itemAtivo(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={ativo ? 'page' : undefined}
                  className={cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                    ativo ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  <item.icon className={cn('size-5', ativo && 'stroke-[2.5]')} />
                  {item.label}
                </Link>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              aria-expanded={maisAberto}
              onClick={() => setMaisAberto((v) => !v)}
              className={cn(
                'flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium',
                maisAberto || algumSecundarioAtivo ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {maisAberto ? <X className="size-5" /> : <Menu className="size-5" />}
              Mais
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}
