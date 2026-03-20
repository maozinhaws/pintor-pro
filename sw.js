const CACHE_NAME = 'pintorplus-v3';
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

  // Nunca cachear chamadas a APIs externas (Google, OAuth, Drive etc.)
  if (!url.startsWith(self.location.origin) && !url.startsWith('https://fonts.')) {
    evt.respondWith(fetch(evt.request));
    return;
  }

  // index.html e raiz do app: network-first (sempre busca versão atualizada)
  if (url.endsWith('/') || url.includes('index.html') || url === self.location.origin + '/') {
    evt.respondWith(
      fetch(evt.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(evt.request, clone));
          return response;
        })
        .catch(() => caches.match(evt.request))
    );
    return;
  }

  // Demais ativos locais e fontes: cache-first
  evt.respondWith(
    caches.match(evt.request).then((cachedResp) => {
      return cachedResp || fetch(evt.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(evt.request, response.clone());
          return response;
        });
      });
    })
  );
});
