const CACHE_NAME = 'pintorplus-mvp-v2';
const STATIC_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  const url = evt.request.url;

  // Pass-through para APIs externas (exceto fontes Google)
  if (!url.startsWith(self.location.origin) && !url.startsWith('https://fonts.')) {
    evt.respondWith(fetch(evt.request));
    return;
  }

  // HTML principal: network-first para garantir versão atualizada
  if (url.endsWith('/') || url.includes('index.html') || url.includes('app.html') || url === self.location.origin + '/') {
    evt.respondWith(
      fetch(evt.request)
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(evt.request, response.clone()));
          return response;
        })
        .catch(() => caches.match(evt.request))
    );
    return;
  }

  // Demais ativos locais e fontes: cache-first
  evt.respondWith(
    caches.match(evt.request).then((cached) =>
      cached || fetch(evt.request).then((response) =>
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(evt.request, response.clone());
          return response;
        })
      )
    )
  );
});
