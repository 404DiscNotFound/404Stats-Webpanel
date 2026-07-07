const CACHE_NAME = '404stats-v0.3a';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.local.js',
  '/app.js',
  '/manifest.json',
  '/logo-404.svg',
  '/default-server-icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
    ))
  );
});
