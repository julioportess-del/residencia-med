'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/** Enquanto a consulta está sendo processada, atualiza a página a cada 3s. */
export function ProcessandoPoll({ rotulo }: { rotulo: string }) {
  const router = useRouter()

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(t)
  }, [router])

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{rotulo}…</p>
      <p className="text-sm text-muted-foreground">
        Isso pode levar alguns instantes. A página atualiza sozinha.
      </p>
    </div>
  )
}
