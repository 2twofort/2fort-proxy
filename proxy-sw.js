'use strict';
(async function () {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/2fort-proxy/proxy-sw.js', { scope: '/2fort-proxy/' });
    console.log('[2Fort] SW registered:', reg.scope);
  } catch (err) {
    console.warn('[2Fort] SW registration failed:', err.message);
  }
})();
