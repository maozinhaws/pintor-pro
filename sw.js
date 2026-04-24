// ============================================
// PINTOR PLUS - SERVICE WORKER
// ============================================

const CACHE_NAME = 'pintor-plus-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache during installation
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/css/styles.css',
  '/js/app_main.js',
  '/js/app_script.js',
  '/js/db.js',
  '/js/sync.js',
  '/js/pdfgen.js',
  '/js/index.js'
];

// Install service worker and cache files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core files');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate service worker and clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Return online or offline page
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful requests
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // If offline, try to serve offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            return caches.match(event.request);
          });
      })
  );
});

// Handle push notifications (if implemented)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Pintor Plus',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Pintor Plus', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
    .then((clientList) => {
      if (clientList.length > 0) {
        // Focus existing window
        return clientList[0].focus();
      }
      // Open new window
      return clients.openWindow('/');
    })
  );
});

// Background sync (for syncing data when connection is restored)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event);

  if (event.tag === 'sync-data') {
    event.waitUntil(
      // This would trigger data synchronization
      // For now, we'll just log it
      new Promise((resolve) => {
        console.log('[SW] Performing background sync');
        resolve();
      })
    );
  }
});

// Periodic background sync (for periodic updates)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic background sync:', event);

  if (event.tag === 'update-data') {
    event.waitUntil(
      new Promise((resolve) => {
        console.log('[SW] Performing periodic sync');
        resolve();
      })
    );
  }
});

// Export for use in other modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CACHE_NAME, OFFLINE_URL, FILES_TO_CACHE };
}