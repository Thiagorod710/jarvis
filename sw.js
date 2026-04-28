const CACHE = 'jarvis-v2'
const ASSETS = ['/', '/index.html', '/manifest.json']

// INSTALL — cache imediato
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  )
  self.skipWaiting()
})

// ACTIVATE — limpa cache antigo
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// FETCH — serve do cache, APIs vão direto
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  const isAPI = ['api.groq.com','api.elevenlabs.io','api.firecrawl.dev','api.github.com','image.pollinations.ai']
    .some(h => url.hostname.includes(h))
  if (isAPI) return

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
      }
      return res
    }))
  )
})

// PUSH NOTIFICATIONS
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'JARVIS', body: 'Atenção, Thiago.' }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [100, 50, 100],
      data: { url: '/' },
      actions: [{ action: 'open', title: 'Abrir JARVIS' }]
    })
  )
})

// Click na notificação — abre o app
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      const c = cs.find(c => c.url === '/' && 'focus' in c)
      return c ? c.focus() : clients.openWindow('/')
    })
  )
})

// SYNC — para quando voltar online
self.addEventListener('sync', e => {
  if (e.tag === 'morning-briefing') {
    e.waitUntil(
      self.registration.showNotification('JARVIS — Bom dia', {
        body: 'Seu briefing do dia está pronto. Abra o JARVIS.',
        icon: '/icon.png',
        vibrate: [200, 100, 200],
      })
    )
  }
})
