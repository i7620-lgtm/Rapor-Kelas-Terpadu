// self destructing sw
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))))
    .then(() => self.clients.claim())
    .then(() => self.registration.unregister())
  );
});
self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));
