// ===== 成长手册 Service Worker =====
const CACHE_NAME = 'growth-manual-v1.3.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/storage.js',
  './js/utils/chart.js',
  './js/utils/firebase-sync.js',
  './js/modules/dashboard.js',
  './js/modules/album.js',
  './js/modules/bills.js',
  './js/modules/finance.js',
  './js/modules/chores.js',
  './js/modules/diplomacy.js',
  './js/modules/community.js',
  './js/modules/memo.js',
  './js/modules/settings.js',
  './js/modules/calendar.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok && e.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
