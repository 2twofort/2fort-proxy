importScripts('/2fort-proxy/scramjet/scramjet.all.js');

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  if (!event.request.url.includes('/2fort-proxy/service/')) return;
  event.respondWith((async () => {
    try {
      await scramjet.loadConfig();
    } catch (e) {
      return fetch(event.request);
    }
    if (scramjet.route(event)) {
      return scramjet.fetch(event);
    }
    return fetch(event.request);
  })());
});
