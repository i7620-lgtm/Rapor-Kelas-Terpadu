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

// Event 'fetch': Sajikan aset dari cache terlebih dahulu
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Event 'message': Dengar pesan dari klien untuk skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
