// Campus Connect — Service Worker v1
// Provides offline support and installability (PWA)

const CACHE = 'campus-connect-v3'

// Core pages to pre-cache on install
const PRECACHE = ['/', '/goods', '/services', '/manifest.webmanifest']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  // Remove old caches from previous versions
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Never intercept: API routes, Supabase, external services
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname === 'wa.me'
  ) return

  // Navigation requests: network-first, fall back to cached '/' for offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(r => r ?? caches.match('/'))
      )
    )
    return
  }

  // Static assets (_next/static, images, fonts): cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|avif|gif|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then(c => c.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Everything else: network-first, cache as fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(CACHE).then(c => c.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
