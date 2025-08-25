const CACHE_NAME = 'smartpin-tpo-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/roofs',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated successfully')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url)
          return response
        }

        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response
            const responseToCache = response.clone()

            // Cache successful responses for HTML, CSS, JS, and images
            const url = event.request.url
            if (url.includes('.js') || url.includes('.css') || 
                url.includes('.png') || url.includes('.jpg') || 
                url.includes('.jpeg') || url.includes('.svg') ||
                url.includes('.ico') || event.request.mode === 'navigate') {
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  console.log('Service Worker: Caching new resource:', url)
                  cache.put(event.request, responseToCache)
                })
            }

            return response
          })
          .catch(() => {
            // If fetch fails, try to serve offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline')
            }
            
            // For other requests, try to serve a cached version
            return caches.match(event.request)
          })
      })
  )
})

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag)
  
  if (event.tag === 'pin-data-sync') {
    event.waitUntil(syncPinData())
  }
})

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-action.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('SmartPin TPO', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})

// Helper function to sync pin data when back online
async function syncPinData() {
  try {
    console.log('Service Worker: Syncing pin data...')
    
    // Get offline data from IndexedDB or localStorage
    const offlineData = await getOfflineData()
    
    if (offlineData && offlineData.length > 0) {
      // Send offline data to server
      const response = await fetch('/api/pins/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offlineData)
      })
      
      if (response.ok) {
        console.log('Service Worker: Pin data synced successfully')
        await clearOfflineData()
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync pin data:', error)
    throw error
  }
}

// Helper function to get offline data
async function getOfflineData() {
  // This would integrate with IndexedDB or localStorage
  // For now, return empty array
  return []
}

// Helper function to clear offline data after successful sync
async function clearOfflineData() {
  // This would clear the offline storage after successful sync
  console.log('Service Worker: Clearing offline data...')
}