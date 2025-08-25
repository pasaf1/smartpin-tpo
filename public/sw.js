// SmartPin TPO Service Worker - Enhanced PWA & Offline Capabilities
const CACHE_NAME = 'smartpin-tpo-v2.0.0'
const API_CACHE_NAME = 'smartpin-api-v2.0.0'
const IMAGE_CACHE_NAME = 'smartpin-images-v2.0.0'
const OFFLINE_CACHE_NAME = 'smartpin-offline-v2.0.0'

// Critical resources to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/login',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints to cache with different strategies
const API_PATTERNS = {
  projects: /\/api\/projects/,
  roofs: /\/api\/roofs/,
  pins: /\/api\/pins/,
  photos: /\/api\/photos/,
  chats: /\/api\/chats/,
  supabase: /\.supabase\.co/
}

// Background sync tags
const SYNC_TAGS = {
  PIN_UPDATES: 'pin-updates',
  PHOTO_UPLOADS: 'photo-uploads',
  CHAT_MESSAGES: 'chat-messages',
  STATUS_CHANGES: 'status-changes',
  PROJECT_UPDATES: 'project-updates'
}

// Install event - cache static assets with enhanced error handling
self.addEventListener('install', (event) => {
  console.log('🔧 SmartPin TPO Service Worker: Installing v2.0.0...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Service Worker: Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, { cache: 'reload' })))
      }),
      
      // Initialize offline storage
      caches.open(OFFLINE_CACHE_NAME).then((cache) => {
        console.log('💾 Service Worker: Initializing offline storage')
        return Promise.resolve()
      }),
      
      // Setup IndexedDB for offline data
      initializeOfflineDB()
      
    ]).then(() => {
      console.log('✅ Service Worker: Installation complete')
      return self.skipWaiting()
    }).catch((error) => {
      console.error('❌ Service Worker: Installation failed:', error)
    })
  )
})

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('🚀 SmartPin TPO Service Worker: Activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME, OFFLINE_CACHE_NAME].includes(cacheName)) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Notify clients of the new service worker
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_NAME
          })
        })
      })
      
    ]).then(() => {
      console.log('✅ Service Worker: Activated successfully')
      return self.clients.claim()
    })
  )
})

// Fetch event - Enhanced network strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests for caching (except POST for background sync)
  if (request.method !== 'GET' && request.method !== 'POST') {
    return
  }
  
  // Skip Chrome extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  // Handle POST requests for offline queueing
  if (request.method === 'POST') {
    event.respondWith(handlePostRequest(request))
    return
  }
  
  // Route GET requests to appropriate strategies
  if (request.url.includes('_next/static/') || request.url.includes('/static/')) {
    // Static assets - Cache First
    event.respondWith(cacheFirst(request, CACHE_NAME))
  } else if (isApiRequest(url)) {
    // API requests - Network First with offline fallback
    event.respondWith(networkFirstWithOfflineFallback(request))
  } else if (isImageRequest(request)) {
    // Images - Cache First with network fallback
    event.respondWith(cacheFirstWithNetworkFallback(request, IMAGE_CACHE_NAME))
  } else if (request.mode === 'navigate') {
    // Page navigation - Network First with offline page fallback
    event.respondWith(handleNavigation(request))
  } else {
    // Default - Network First with cache fallback
    event.respondWith(networkFirst(request, CACHE_NAME))
  }
})

// Enhanced cache strategies
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('❌ Network error in cacheFirst:', error)
    throw error
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log('🔄 Network failed, trying cache:', request.url)
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    throw error
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log('🔄 API network failed, trying cache:', request.url)
    const cached = await caches.match(request)
    if (cached) {
      // Add offline indicator to cached API responses
      const clonedResponse = cached.clone()
      const data = await clonedResponse.json()
      return new Response(JSON.stringify({
        ...data,
        _offline: true,
        _cachedAt: new Date().toISOString()
      }), {
        status: cached.status,
        statusText: cached.statusText,
        headers: {
          ...cached.headers,
          'X-Served-By': 'service-worker-cache'
        }
      })
    }
    
    // Return offline fallback response for API requests
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This data is not available offline',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable - Offline',
      headers: {
        'Content-Type': 'application/json',
        'X-Served-By': 'service-worker-offline'
      }
    })
  }
}

async function cacheFirstWithNetworkFallback(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return placeholder for failed image requests
    return new Response(
      '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" font-family="Arial" font-size="14" fill="#6b7280" text-anchor="middle" dy=".35em">Image Unavailable</text></svg>',
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    )
  }
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    console.log('🔄 Navigation failed, serving offline page')
    const cached = await caches.match('/offline')
    return cached || new Response(generateOfflineHTML(), {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

async function handlePostRequest(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    // Queue POST request for background sync
    const clonedRequest = request.clone()
    const body = await clonedRequest.text()
    
    // Store in IndexedDB for background sync
    await queueOfflineRequest({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now()
    })
    
    // Register background sync
    if ('serviceWorker' in self && 'sync' in self.registration) {
      await self.registration.sync.register('offline-requests')
    }
    
    return new Response(JSON.stringify({
      success: false,
      queued: true,
      message: 'Request queued for when connection is restored'
    }), {
      status: 202,
      statusText: 'Accepted - Queued for Sync',
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('supabase.co') ||
         Object.values(API_PATTERNS).some(pattern => pattern.test(url.href))
}

function isImageRequest(request) {
  return request.destination === 'image' ||
         request.url.includes('/photos/') ||
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(request.url)
}

function generateOfflineHTML() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SmartPin TPO - Offline</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
               color: white; margin: 0; padding: 0; min-height: 100vh; 
               display: flex; align-items: center; justify-content: center; }
        .container { text-align: center; padding: 2rem; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { font-size: 2rem; margin-bottom: 1rem; }
        p { font-size: 1.1rem; margin-bottom: 2rem; opacity: 0.9; }
        .btn { background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3);
               padding: 0.75rem 2rem; border-radius: 0.5rem; color: white; text-decoration: none;
               display: inline-block; transition: all 0.3s; }
        .btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔌</div>
        <h1>You're Offline</h1>
        <p>SmartPin TPO is working offline. Your changes will sync when connection is restored.</p>
        <a href="/" class="btn" onclick="window.location.reload()">Try Again</a>
      </div>
    </body>
    </html>
  `
}

// Enhanced Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag)
  
  switch (event.tag) {
    case SYNC_TAGS.PIN_UPDATES:
      event.waitUntil(syncPinUpdates())
      break
    case SYNC_TAGS.PHOTO_UPLOADS:
      event.waitUntil(syncPhotoUploads())
      break
    case SYNC_TAGS.CHAT_MESSAGES:
      event.waitUntil(syncChatMessages())
      break
    case SYNC_TAGS.STATUS_CHANGES:
      event.waitUntil(syncStatusChanges())
      break
    case SYNC_TAGS.PROJECT_UPDATES:
      event.waitUntil(syncProjectUpdates())
      break
    case 'offline-requests':
      event.waitUntil(syncOfflineRequests())
      break
    default:
      console.log('🤷 Service Worker: Unknown sync tag:', event.tag)
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

// Enhanced background sync functions
async function syncPinUpdates() {
  console.log('🔄 Syncing pin updates...')
  
  try {
    const pendingUpdates = await getOfflineData('pin-updates')
    let successCount = 0
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/pins/' + update.pinId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data)
        })
        
        if (response.ok) {
          await removeOfflineData('pin-updates', update.id)
          successCount++
          console.log('✅ Pin update synced:', update.pinId)
        }
      } catch (error) {
        console.error('❌ Failed to sync pin update:', error)
      }
    }
    
    if (successCount > 0) {
      notifyClients({ type: 'SYNC_COMPLETE', category: 'pin-updates', count: successCount })
    }
  } catch (error) {
    console.error('❌ Error in syncPinUpdates:', error)
  }
}

async function syncPhotoUploads() {
  console.log('🔄 Syncing photo uploads...')
  
  try {
    const pendingUploads = await getOfflineData('photo-uploads')
    let successCount = 0
    let failedCount = 0
    
    for (const upload of pendingUploads) {
      try {
        console.log(`📤 Syncing photo upload: ${upload.data.file.name}`)
        
        // Convert base64 back to File object
        const response = await fetch(upload.data.file.data)
        const blob = await response.blob()
        const file = new File([blob], upload.data.file.name, {
          type: upload.data.file.type,
          lastModified: Date.now()
        })
        
        const formData = new FormData()
        formData.append('photo', file)
        formData.append('pinId', upload.data.pinId)
        formData.append('uploadType', upload.data.uploadType)
        formData.append('compress', 'true')
        formData.append('generateThumbnail', 'true')
        
        const uploadResponse = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData
        })
        
        if (uploadResponse.ok) {
          await removeOfflineData('photo-uploads', upload.id)
          successCount++
          console.log(`✅ Photo upload synced: ${upload.data.file.name}`)
          
          // Notify progress to clients
          notifyClients({ 
            type: 'UPLOAD_PROGRESS', 
            uploadId: upload.id,
            status: 'completed',
            fileName: upload.data.file.name
          })
        } else {
          const errorData = await uploadResponse.json()
          console.error(`❌ Photo upload failed: ${errorData.error}`)
          failedCount++
          
          // Increment retry count
          upload.retries = (upload.retries || 0) + 1
          if (upload.retries >= upload.maxRetries) {
            console.error(`🚫 Max retries exceeded for photo: ${upload.data.file.name}`)
            await removeOfflineData('photo-uploads', upload.id)
            
            notifyClients({ 
              type: 'UPLOAD_FAILED', 
              uploadId: upload.id,
              fileName: upload.data.file.name,
              error: 'Max retries exceeded'
            })
          }
        }
      } catch (error) {
        console.error('❌ Failed to sync photo upload:', error)
        failedCount++
        
        // Increment retry count
        upload.retries = (upload.retries || 0) + 1
        if (upload.retries >= upload.maxRetries) {
          console.error(`🚫 Max retries exceeded for photo: ${upload.data?.file?.name}`)
          await removeOfflineData('photo-uploads', upload.id)
        }
      }
    }
    
    if (successCount > 0) {
      notifyClients({ 
        type: 'SYNC_COMPLETE', 
        category: 'photo-uploads', 
        count: successCount,
        failed: failedCount
      })
    }
  } catch (error) {
    console.error('❌ Error in syncPhotoUploads:', error)
  }
}

async function syncChatMessages() {
  console.log('🔄 Syncing chat messages...')
  
  try {
    const pendingMessages = await getOfflineData('chat-messages')
    let successCount = 0
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data)
        })
        
        if (response.ok) {
          await removeOfflineData('chat-messages', message.id)
          successCount++
          console.log('✅ Chat message synced:', message.id)
        }
      } catch (error) {
        console.error('❌ Failed to sync chat message:', error)
      }
    }
    
    if (successCount > 0) {
      notifyClients({ type: 'SYNC_COMPLETE', category: 'chat-messages', count: successCount })
    }
  } catch (error) {
    console.error('❌ Error in syncChatMessages:', error)
  }
}

async function syncStatusChanges() {
  console.log('🔄 Syncing status changes...')
  
  try {
    const pendingChanges = await getOfflineData('status-changes')
    let successCount = 0
    
    for (const change of pendingChanges) {
      try {
        const response = await fetch(`/api/pins/${change.pinId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: change.status })
        })
        
        if (response.ok) {
          await removeOfflineData('status-changes', change.id)
          successCount++
          console.log('✅ Status change synced:', change.pinId)
        }
      } catch (error) {
        console.error('❌ Failed to sync status change:', error)
      }
    }
    
    if (successCount > 0) {
      notifyClients({ type: 'SYNC_COMPLETE', category: 'status-changes', count: successCount })
    }
  } catch (error) {
    console.error('❌ Error in syncStatusChanges:', error)
  }
}

async function syncProjectUpdates() {
  console.log('🔄 Syncing project updates...')
  
  try {
    const pendingUpdates = await getOfflineData('project-updates')
    let successCount = 0
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/projects/' + update.projectId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data)
        })
        
        if (response.ok) {
          await removeOfflineData('project-updates', update.id)
          successCount++
          console.log('✅ Project update synced:', update.projectId)
        }
      } catch (error) {
        console.error('❌ Failed to sync project update:', error)
      }
    }
    
    if (successCount > 0) {
      notifyClients({ type: 'SYNC_COMPLETE', category: 'project-updates', count: successCount })
    }
  } catch (error) {
    console.error('❌ Error in syncProjectUpdates:', error)
  }
}

async function syncOfflineRequests() {
  console.log('🔄 Syncing offline requests...')
  
  try {
    const pendingRequests = await getOfflineData('offline-requests')
    let successCount = 0
    
    for (const req of pendingRequests) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body
        })
        
        if (response.ok) {
          await removeOfflineData('offline-requests', req.id)
          successCount++
          console.log('✅ Offline request synced:', req.url)
        }
      } catch (error) {
        console.error('❌ Failed to sync offline request:', error)
      }
    }
    
    if (successCount > 0) {
      notifyClients({ type: 'SYNC_COMPLETE', category: 'offline-requests', count: successCount })
    }
  } catch (error) {
    console.error('❌ Error in syncOfflineRequests:', error)
  }
}

// IndexedDB utilities for offline storage
async function initializeOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SmartPinOfflineDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create object stores for different types of offline data
      const stores = ['pin-updates', 'photo-uploads', 'chat-messages', 'status-changes', 'project-updates', 'offline-requests']
      
      stores.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      })
    }
  })
}

async function getOfflineData(type) {
  try {
    const db = await initializeOfflineDB()
    const transaction = db.transaction([type], 'readonly')
    const store = transaction.objectStore(type)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  } catch (error) {
    console.error('❌ Error getting offline data:', error)
    return []
  }
}

async function queueOfflineRequest(data) {
  try {
    const db = await initializeOfflineDB()
    const transaction = db.transaction(['offline-requests'], 'readwrite')
    const store = transaction.objectStore('offline-requests')
    
    return new Promise((resolve, reject) => {
      const request = store.add(data)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  } catch (error) {
    console.error('❌ Error queuing offline request:', error)
  }
}

async function removeOfflineData(type, id) {
  try {
    const db = await initializeOfflineDB()
    const transaction = db.transaction([type], 'readwrite')
    const store = transaction.objectStore(type)
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  } catch (error) {
    console.error('❌ Error removing offline data:', error)
  }
}

function notifyClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message)
    })
  })
}