import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST)

// Cache static assets
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
)

registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'assets',
  })
)

// Network first for API calls (with fallback to cache)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
)

// Supabase API calls
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
)

// Offline fallback
const OFFLINE_PAGE = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-cache').then((cache) => {
      return cache.add(OFFLINE_PAGE)
    })
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_PAGE)
      })
    )
  }
})

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'NETWORK_STATUS_CHANGE') {
    // Broadcast network status change to all clients
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'NETWORK_STATUS_UPDATE',
          isOnline: event.data.isOnline
        })
      })
    })
  }
})