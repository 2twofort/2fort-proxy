importScripts('/2fort-proxy/scramjet/scramjet.all.js');

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

async function wipeIDB() {
  await new Promise(r => {
    const req = indexedDB.deleteDatabase('$scramjet');
    req.onsuccess = req.onerror = req.onblocked = r;
  });
}

async function handleRequest(event) {
  try {
    await scramjet.loadConfig();
  } catch (e) {
    await wipeIDB();
    return fetch(event.request);
  }
  if (scramjet.route(event)) {
    try {
      return await scramjet.fetch(event);
    } catch (e) {
      await wipeIDB();
      return fetch(event.request);
    }
  }
  return fetch(event.request);
}

self.addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});
