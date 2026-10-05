/* Network-first for shell + assets so deploys win over stale PWA cache. */
const CACHE = 'n10-shell-v23'
const BASE = self.registration.scope // e.g. https://n10-kart.netlify.app/
const SHELL = ['', 'index.html', 'manifest.webmanifest', 'n10-mark.png', 'n10-logo.jpg', 'apple-touch-icon.png'].map(
  (p) => new URL(p || './', BASE).href,
)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  // HTML + JS + CSS: network first so a new deploy is not stuck behind old cache
  const networkFirst =
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.webmanifest')

  if (networkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => caches.match(event.request)),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (
            res.ok &&
            (url.pathname.includes('/icons/') ||
              url.pathname.endsWith('.png') ||
              url.pathname.endsWith('.svg') ||
              url.pathname.endsWith('.jpg'))
          ) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
