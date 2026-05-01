const CACHE = 'pp-mvp-v1';

const PRECACHE = [
  '/mvp/',
  '/mvp/index.html',
  '/mvp/css/tokens.css',
  '/mvp/css/base.css',
  '/mvp/css/components.css',
  '/mvp/css/views.css',
  '/mvp/js/app.js',
  '/mvp/js/db.js',
  '/mvp/js/utils.js',
  '/mvp/js/state.js',
  '/mvp/js/toast.js',
  '/mvp/js/router.js',
  '/mvp/js/orcamentos.js',
  '/mvp/js/clientes.js',
  '/mvp/js/pdf.js',
  '/mvp/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // html2pdf CDN — network only
  if (url.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Google Fonts — cache first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // Same-origin HTML — network first, cache fallback
  if (e.request.mode === 'navigate' || (url.origin === self.location.origin && e.request.headers.get('accept')?.includes('text/html'))) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('/mvp/index.html')))
    );
    return;
  }

  // Same-origin assets — cache first
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // Everything else — network
  e.respondWith(fetch(e.request));
});
