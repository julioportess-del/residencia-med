import { type ReactNode } from 'react'
import { Info, CheckCircle2, AlertTriangle, AlertCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export type AlertVariant = 'info' | 'success' | 'warning' | 'destructive'

const CONFIG: Record<AlertVariant, { caixa: string; icone: LucideIcon; corIcone: string }> = {
  info: { caixa: 'border-primary/30 bg-primary/5', icone: Info, corIcone: 'text-primary' },
  success: {
    caixa: 'border-success/30 bg-success/5',
    icone: CheckCircle2,
    corIcone: 'text-success',
  },
  warning: {
    caixa: 'border-warning/30 bg-warning/5',
    icone: AlertTriangle,
    corIcone: 'text-warning',
  },
  destructive: {
    caixa: 'border-destructive/30 bg-destructive/5',
    icone: AlertCircle,
    corIcone: 'text-destructive',
  },
}

interface AlertProps {
  variant?: AlertVariant
  titulo?: string
  children?: ReactNode
  className?: string
}

/** Mensagem contextual (info/sucesso/aviso/erro) tokenizada, com ícone. */
export function Alert({ variant = 'info', titulo, children, className }: AlertProps) {
  const c = CONFIG[variant]
  const Icone = c.icone
  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-lg border p-3 text-sm', c.caixa, className)}
    >
      <Icone className={cn('mt-0.5 h-4 w-4 shrink-0', c.corIcone)} />
      <div className="space-y-0.5">
        {titulo ? <p className="font-medium text-foreground">{titulo}</p> : null}
        {children ? <div className="text-foreground/90">{children}</div> : null}
      </div>
    </div>
  )
}
