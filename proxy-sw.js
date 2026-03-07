importScripts('/2fort-proxy/scramjet/scramjet.codecs.js');
importScripts('/2fort-proxy/scramjet/scramjet.shared.js');
importScripts('/2fort-proxy/scramjet/scramjet.worker.js');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
