'use client'

import { useEffect } from 'react'

/**
 * Registra o service worker em /sw.js. Componente client-side mountado no
 * AppShell (apenas usuários logados); a landing pública não precisa de SW.
 */
export function RegistrarSW() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((e) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[sw] falha ao registrar', e)
        }
      })
  }, [])

  return null
}
