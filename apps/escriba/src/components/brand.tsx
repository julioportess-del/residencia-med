import { AudioLines } from 'lucide-react'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <AudioLines className="h-4 w-4" />
      </span>
      {!compact && <span className="text-lg">Escriba</span>}
    </span>
  )
}
