'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

const OPCOES = [
  { v: 'light', icon: Sun, label: 'Claro' },
  { v: 'dark', icon: Moon, label: 'Escuro' },
  { v: 'system', icon: Monitor, label: 'Sistema' },
] as const

export function ThemeToggle({ compacto = false }: { compacto?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [montado, setMontado] = useState(false)

  useEffect(() => setMontado(true), [])
  if (!montado) return <div className={compacto ? 'h-8 w-24' : 'h-9 w-32'} />

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border bg-background p-0.5',
        compacto && 'p-0',
      )}
      role="radiogroup"
      aria-label="Escolher tema"
    >
      {OPCOES.map((o) => {
        const ativo = theme === o.v
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={ativo}
            aria-label={o.label}
            onClick={() => setTheme(o.v)}
            className={cn(
              'flex items-center justify-center rounded-full transition-colors',
              compacto ? 'size-7' : 'size-8',
              ativo
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title={o.label}
          >
            <o.icon className={compacto ? 'size-3.5' : 'size-4'} />
          </button>
        )
      })}
    </div>
  )
}
