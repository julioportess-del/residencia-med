import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { STATUS_CONSULTA_LABEL } from '@/lib/rotulos'

const VARIANTE: Record<string, BadgeVariant> = {
  GRAVANDO: 'destructive',
  TRANSCREVENDO: 'warning',
  ESTRUTURANDO: 'warning',
  RASCUNHO: 'default',
  REVISADO: 'success',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANTE[status] ?? 'secondary'}>
      {STATUS_CONSULTA_LABEL[status] ?? status}
    </Badge>
  )
}
