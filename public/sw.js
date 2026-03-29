const CACHE_NAME = 'booktotal-v2';
const STATIC_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
  '/css/layout.css',
  '/css/site-menu.css',
  '/css/admin-sidebar.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  let path = '';
  try {
    path = new URL(event.request.url).pathname;
  } catch (e) {
    /* ignore */
  }
  // Giỏ hàng theo cookie — không được trả từ cache (sẽ luôn thấy giỏ rỗng dù đã thêm SP)
  if (path === '/cart-data') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Never cache HTML pages with user-specific state (login/cart/notifications)
  // to avoid serving stale anonymous pages after login.
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/').then((r) => r || new Response('Offline', { status: 503, statusText: 'Offline' }));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const clone = res.clone();
        if (res.ok && (event.request.url.startsWith('http') && !event.request.url.includes('/api/'))) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        return new Response('', { status: 503 });
      });
    })
  );
});
