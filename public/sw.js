// NutriAnalytics Service Worker
const CACHE_NAME = 'nutrianalytics-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network First strategy with Cache fallback
// Ensuring live database metrics are always fresh while maintaining offline capability
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and http/https schemes
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for static assets
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.includes('/build/') ||
           event.request.url.includes('.png') ||
           event.request.url.includes('.svg') ||
           event.request.url.includes('.woff2'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If offline or network fails, fallback to cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If navigation request fails, return cached root
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Sin conexión a Internet', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });
      })
  );
});
