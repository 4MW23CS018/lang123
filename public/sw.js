// public/sw.js - LangBridge PWA Service Worker
const CACHE_NAME = 'langbridge-cache-v4';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

// Install Event: pre-cache the critical application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching application shell');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[Service Worker] Pre-caching partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clear legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: handle caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET requests (e.g. POST to /assess, /transcribe, /tts)
  if (request.method !== 'GET') {
    return;
  }

  // Bypass Convex backend, WebSocket, and external API calls
  if (
    url.hostname.includes('convex.cloud') ||
    url.hostname.includes('convex.site') ||
    url.pathname.startsWith('/api/') ||
    url.port === '5000' ||
    url.hostname.includes('loca.lt') ||
    url.hostname.includes('trycloudflare.com') ||
    url.hostname.includes('ngrok')
  ) {
    return;
  }

  // Navigation requests: Network-first falling back to cached index.html (SPA routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html') || await caches.match('/');
          return cached || new Response('Offline - Please check your internet connection', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // Static assets (scripts, styles, fonts, images): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Immediate activation message support
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
