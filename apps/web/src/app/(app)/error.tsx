'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app] error boundary capturou:', error)
  }, [error])

  return (
    <div className="container mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-lg font-semibold text-rose-900">Algo deu errado</h2>
        <p className="mt-2 text-sm text-rose-800">
          {error.message || 'Erro inesperado ao renderizar a página.'}
        </p>
        {error.stack ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-rose-700">
              Ver detalhes técnicos
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[11px] text-rose-900">
              {error.stack.substring(0, 800)}
            </pre>
          </details>
        ) : null}
        {error.digest ? (
          <p className="mt-1 text-xs text-rose-700">Digest: {error.digest}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={reset} variant="outline" size="sm">
            <RefreshCw className="size-4" /> Tentar de novo
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" /> Ir pro painel
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
