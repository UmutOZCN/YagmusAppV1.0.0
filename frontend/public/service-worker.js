// lightweight PWA service worker for Yağmuş
const CACHE_NAME = 'yagmus-v2';
const CORE_ASSETS = [
  '/',                 // start_url
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: önbelleğe çek
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: eski cache'leri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== CACHE_NAME)
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first (API), cache-first (statik)
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // API istekleri: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Diğerleri: cache-first, yoksa network
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
