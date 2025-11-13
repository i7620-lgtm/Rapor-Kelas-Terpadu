// sw.js

const CACHE_NAME = 'rkt-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.js',
  '/App.js',
  '/constants.js',
  '/components/Sidebar.js',
  '/components/Dashboard.js',
  '/components/PlaceholderPage.js',
  '/components/SettingsPage.js',
  '/components/DataSiswaPage.js',
  '/components/DataNilaiPage.js',
  '/components/CatatanWaliKelasPage.js',
  '/components/DataAbsensiPage.js',
  '/components/DataEkstrakurikulerPage.js',
  '/components/PrintRaporPage.js',
  '/components/PrintLegerPage.js',
  '/components/Toast.js',
  '/components/TransliterationUtil.js',
  '/terms.html',
  '/privacy.html'
];

// Event 'install': Cache file-file penting aplikasi
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Event 'activate': Bersihkan cache lama dan klaim kontrol
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Event 'fetch': Tangani permintaan jaringan dengan strategi yang tepat
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Abaikan semua permintaan ke domain Google untuk menghindari masalah otentikasi/CORS.
  // Service Worker tidak akan mencegat permintaan ini, membiarkan browser menanganinya secara normal.
  if (requestUrl.hostname.endsWith('google.com') || requestUrl.hostname.endsWith('googleapis.com')) {
    return;
  }

  // Untuk permintaan non-GET (seperti PATCH, POST), langsung ke jaringan. Jangan cache.
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Untuk permintaan GET lainnya (aset aplikasi), gunakan strategi network-first.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Jika berhasil, perbarui cache dan kembalikan respons jaringan.
        // PENTING: Hanya cache permintaan http/https untuk menghindari error pada 'chrome-extension://'
        if (event.request.url.startsWith('http')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika jaringan gagal, coba sajikan dari cache.
        return caches.match(event.request);
      })
  );
});


// Event 'message': Dengar pesan dari klien untuk skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Event 'sync': Handle background sync requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-rkt-drive') {
    console.log('Sync event received for RKT data.');
    event.waitUntil(
      // Beri tahu semua klien yang terbuka untuk mencoba melakukan sinkronisasi
      self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      }).then(clients => {
        if (clients && clients.length) {
          console.log('Notifying open clients to execute sync.');
          clients.forEach(client => {
            client.postMessage({ type: 'EXECUTE_SYNC' });
          });
        } else {
          console.log('No open clients to notify for sync. Sync will be retried later.');
        }
      })
    );
  }
});
