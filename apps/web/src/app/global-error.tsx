'use client'

import { useEffect } from 'react'

/**
 * Captura erros que crasham o root layout (TRPCProvider, ThemeProvider).
 * Substitui a mensagem genérica "Application error: a client-side exception..."
 * com detalhes acionáveis.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global] erro fatal:', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0 }}>
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
            <details style={{ marginTop: 12 }} open>
              <summary style={{ cursor: 'pointer', fontSize: 12, color: '#b91c1c' }}>
                Ver detalhes técnicos
              </summary>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 11,
                  marginTop: 8,
                  maxHeight: 320,
                  overflow: 'auto',
                  background: '#fff',
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                {error.stack.substring(0, 2000)}
              </pre>
            </details>
          ) : null}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if ('caches' in window) {
                  caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
                }
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker
                    .getRegistrations()
                    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
                    .finally(() => window.location.reload())
                } else {
                  window.location.reload()
                }
              }}
              style={{
                padding: '8px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Limpar cache + recarregar
            </button>
            <button
              onClick={reset}
              style={{
                padding: '8px 16px',
                background: '#AB5D21',
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
                color: '#AB5D21',
                border: '1px solid #AB5D21',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              Início
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
