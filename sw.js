const CACHE_NAME = 'pintorplus-v16';
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

// ── Notificações em background ───────────────────────────────────────────
let _pendingAlarms = [];

function _msUntilAlarm(ev) {
  const evDate = new Date(`${ev.dat}T${ev.hora}`);
  let alertTime = new Date(evDate.getTime());
  const val = parseInt(ev.avisoVal) || 0;
  if (val > 0) {
    if (ev.avisoUnid === 'm') alertTime.setMinutes(alertTime.getMinutes() - val);
    else if (ev.avisoUnid === 'h') alertTime.setHours(alertTime.getHours() - val);
    else if (ev.avisoUnid === 'd') alertTime.setDate(alertTime.getDate() - val);
  }
  return alertTime.getTime() - Date.now();
}

async function _checkSWAlarms() {
  const now = Date.now();
  for (const ev of _pendingAlarms) {
    if (_msUntilAlarm(ev) <= 0) {
      await self.registration.showNotification('🔔 Pintor Plus — Lembrete', {
        body: ev.tit,
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-96x96.png',
        tag: 'pp-alarm-' + ev.id,
        renotify: true,
        data: { evId: ev.id }
      });
    }
  }
  // Remove os que já foram disparados
  _pendingAlarms = _pendingAlarms.filter(ev => _msUntilAlarm(ev) > 0);
}

// Recebe dados do app
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'show-notification') {
    self.registration.showNotification(event.data.title || 'Pintor Plus', {
      body: event.data.body || '',
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-96x96.png',
      tag: 'pp-alarm',
      renotify: true,
    });
  }
  if (event.data.type === 'sync-alarms') {
    _pendingAlarms = event.data.alarms || [];
    // Agenda verificações futuras
    _pendingAlarms.forEach(ev => {
      const ms = _msUntilAlarm(ev);
      if (ms > 0 && ms < 86400000) { // só agenda para as próximas 24h
        setTimeout(() => _checkSWAlarms(), ms + 1000);
      }
    });
  }
});

// Clique na notificação → abre o app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const appClient = clients.find(c => c.url.includes('pintorplus') || c.url.includes('app.html'));
      if (appClient) return appClient.focus();
      return self.clients.openWindow('/app.html#pg-agenda');
    })
  );
});

// Periodic Background Sync (Chrome Android — instalado como PWA)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'pp-check-alarms') {
    event.waitUntil(_checkSWAlarms());
  }
});

self.addEventListener('fetch', (evt) => {
  // Aproveita cada requisição de rede para verificar alarmes pendentes
  if (_pendingAlarms.length > 0) _checkSWAlarms();

  const url = evt.request.url;

  // Nunca cachear chamadas a APIs externas (Google, OAuth, Drive etc.)
  if (!url.startsWith(self.location.origin) && !url.startsWith('https://fonts.')) {
    evt.respondWith(fetch(evt.request));
    return;
  }

  // Páginas HTML principais: network-first (sempre busca versão atualizada)
  if (url.endsWith('/') || url.includes('index.html') || url.includes('app.html') || url === self.location.origin + '/') {
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
