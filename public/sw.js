// SmartPin TPO Service Worker
const CACHE_NAME = 'smartpin-tpo-v1'
const STATIC_CACHE = 'smartpin-static-v1'

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'SmartPin TPO',
    body: 'New activity in your project',
    icon: '/icons/icon-192x192.png',
    tag: 'smartpin-notification',
    data: {}
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      notificationData = { ...notificationData, ...payload }
    } catch (error) {
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      tag: notificationData.tag,
      data: notificationData.data
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            return
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})
