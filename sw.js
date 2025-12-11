
// sw.js

// GANTI VERSI INI SETIAP KALI ADA UPDATE KODE (Misal: v2, v3, dst)
const CACHE_NAME = 'rkt-cache-v2';

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
  '/components/JurnalFormatifPage.js',
  '/components/DriveDataSelectionModal.js',
  '/components/Navigation.js',
  '/hooks/useServiceWorker.js',
  '/hooks/useGoogleAuth.js',
  '/hooks/useWindowDimensions.js',
  '/terms.html',
  '/privacy.html',
  '/presets.json'
];

// Event 'install': Cache file-file penting aplikasi
self.addEventListener('install', (event) => {
  // Paksa SW baru untuk segera menggantikan yang lama di fase waiting
  self.skipWaiting(); 
  
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
          // Hapus cache yang namanya tidak sama dengan CACHE_NAME saat ini
          // Ini menghapus file lama, TAPI TIDAK MENGHAPUS LOCAL STORAGE (Data Siswa Aman)
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
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

  // PENTING: Hanya tangani permintaan http/https. Ini mencegah error dari fetch chrome-extension://.
  if (!requestUrl.protocol.startsWith('http')) {
    return; // Biarkan browser menangani permintaan non-http.
  }

  // Abaikan semua permintaan ke domain Google untuk menghindari masalah otentikasi/CORS.
  if (requestUrl.hostname.endsWith('google.com') || requestUrl.hostname.endsWith('googleapis.com')) {
    return;
  }

  // Untuk permintaan non-GET (seperti PATCH, POST), langsung ke jaringan. Jangan cache.
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Strategi Network-First untuk HTML dan JS utama agar update lebih cepat terdeteksi
  // Jika offline, baru ambil dari cache.
  if (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html' || requestUrl.pathname.endsWith('.js')) {
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          })
          .catch(() => {
            return caches.match(event.request);
          })
      );
      return;
  }

  // Untuk aset lain (gambar, font), gunakan strategi Cache-First (lebih cepat)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (networkResponse) => {
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        );
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
    event.waitUntil(
      self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      }).then(clients => {
        if (clients && clients.length) {
          clients.forEach(client => {
            client.postMessage({ type: 'EXECUTE_SYNC' });
          });
        }
      })
    );
  }
});
