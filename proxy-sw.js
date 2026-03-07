// v9
importScripts('/2fort-proxy/uv/uv.bundle.js');
importScripts('/2fort-proxy/uv/uv.config.js');
importScripts('/2fort-proxy/uv/uv.sw.js');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const sw = new UVServiceWorker();
self.addEventListener('fetch', event => event.respondWith(sw.fetch(event)));
