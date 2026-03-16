// Service Worker — Le faremo sapere

self.addEventListener('install', e => { self.skipWaiting() })
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()) })

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')))
  }
})

self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || '👻 Le faremo sapere', {
      body: data.body || '',
      icon: '/icon-192.png',      // logo app — immagine grande della notifica
      badge: '/ghost-badge.svg',  // 👻 fantasmino — icona piccola in alto a sx accanto al titolo
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const existing = cls.find(c => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return clients.openWindow(event.notification.data?.url || '/')
    })
  )
})