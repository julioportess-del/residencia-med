import { cn } from '@/lib/cn'
import { STATUS_CONSULTA_LABEL } from '@/lib/rotulos'

const ESTILO: Record<string, string> = {
  GRAVANDO: 'bg-destructive/10 text-destructive',
  TRANSCREVENDO: 'bg-warning/15 text-warning',
  ESTRUTURANDO: 'bg-warning/15 text-warning',
  RASCUNHO: 'bg-accent text-accent-foreground',
  REVISADO: 'bg-success/15 text-success',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium',
        ESTILO[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {STATUS_CONSULTA_LABEL[status] ?? status}
    </span>
  )
}
