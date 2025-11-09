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

// Event 'fetch': Prioritaskan jaringan, gunakan cache sebagai fallback (Network-First)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Coba ambil dari jaringan terlebih dahulu
    fetch(event.request)
      .then((networkResponse) => {
        // Jika berhasil, kloning respons
        const responseToCache = networkResponse.clone();
        // Buka cache dan simpan respons baru
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        // Kembalikan respons dari jaringan
        return networkResponse;
      })
      .catch(() => {
        // Jika permintaan jaringan gagal (misalnya, offline),
        // coba sajikan respons dari cache
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
