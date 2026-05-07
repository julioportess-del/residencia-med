'use client'

import { useEffect } from 'react'

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[root] error boundary capturou:', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 40 }}>
        <div
          style={{
            maxWidth: 720,
            margin: '40px auto',
            padding: 24,
            border: '1px solid #fecaca',
            borderRadius: 12,
            background: '#fef2f2',
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#7f1d1d', margin: 0 }}>
            Erro inesperado
          </h1>
          <p style={{ fontSize: 14, color: '#991b1b', marginTop: 8 }}>
            {error.message || 'Algo quebrou ao carregar a aplicação.'}
          </p>
          {error.digest ? (
            <p style={{ fontSize: 11, color: '#b91c1c', marginTop: 4 }}>Digest: {error.digest}</p>
          ) : null}
          {error.stack ? (
            <details style={{ marginTop: 12 }}>
              <summary
                style={{ cursor: 'pointer', fontSize: 12, color: '#b91c1c' }}
              >
                Ver detalhes técnicos
              </summary>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 11,
                  marginTop: 8,
                  maxHeight: 240,
                  overflow: 'auto',
                  background: '#fff',
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                {error.stack.substring(0, 1200)}
              </pre>
            </details>
          ) : null}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{
                padding: '8px 16px',
                background: '#1d4ed8',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Tentar de novo
            </button>
            <a
              href="/"
              style={{
                padding: '8px 16px',
                background: 'white',
                color: '#1d4ed8',
                border: '1px solid #1d4ed8',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              Página inicial
            </a>
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 24 }}>
            Se o erro persistir, abra o DevTools (Cmd+Option+I), aba Console, recarregue, e
            envie o stack trace.
          </p>
        </div>
      </body>
    </html>
  )
}
