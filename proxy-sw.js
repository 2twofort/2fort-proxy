import '/2fort-proxy/scramjet/scramjet.all.js';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
