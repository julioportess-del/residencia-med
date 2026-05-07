/**
 * Service Worker do Residência Med.
 * - Push: recebe notificações do servidor
 * - Click em notificação: abre URL especificada
 * - Cache leve: assets estáticos (Next.js cache funciona bem por padrão)
 */

const CACHE_NAME = 'residencia-med-v3'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // limpa TODOS os caches antigos
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
    ]),
  )
})

// Não intercepta fetches — apenas push notifications. Evita servir bundle JS desatualizado.

// Push notifications
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (_e) {
    data = { title: 'Residência Med', body: event.data ? event.data.text() : '' }
  }

  const titulo = data.titulo || data.title || 'Residência Med'
  const opcoes = {
    body: data.conteudo || data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tipo || 'generico',
    renotify: true,
    data: { url: data.link || data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(titulo, opcoes))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientes) => {
      // Reusa janela existente se já estiver aberta
      const existente = clientes.find((c) => c.url.includes(self.location.origin))
      if (existente) {
        existente.focus()
        return existente.navigate(url).catch(() => null)
      }
      return self.clients.openWindow(url)
    }),
  )
})
