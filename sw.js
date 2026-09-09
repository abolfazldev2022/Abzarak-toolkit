/**
 * sw.js
 * -----------------------------------------------------------------------
 * A minimal offline-first Service Worker.
 * NOTE: Service Workers only register over http(s) or localhost - they
 * do NOT run when index.html is opened directly via file://. The app's
 * generators and tools work fully without it either way; this only adds
 * "installable app" + "instant offline reload" behaviour when served
 * over a real (or local) web server.
 * -----------------------------------------------------------------------
 */

const CACHE_NAME = 'abzarak-cache-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/responsive.css',
  './js/app.js',
  './js/generators.js',
  './js/storage.js',
  './js/ui.js',
  './assets/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Cache what we can; ignore individual failures (e.g. missing local font files)
      // so the whole install step doesn't fail because of one optional asset.
      Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Cache a copy of any successful same-origin GET response for future offline use.
          if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
