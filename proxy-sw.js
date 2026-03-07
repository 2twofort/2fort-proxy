// v8
importScripts('/2fort-proxy/uv/uv.bundle.js');
importScripts('/2fort-proxy/uv/uv.config.js');
importScripts('/2fort-proxy/uv/uv.sw.js');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
