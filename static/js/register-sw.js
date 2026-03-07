'use strict';
(async function () {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/2fort-proxy/proxy-sw.js', {
      scope: '/2fort-proxy/',
      type: 'module'
    });
    console.log('[2Fort] SW registered:', reg.scope);
    if (!navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
    }
  } catch (err) {
    console.warn('[2Fort] SW registration failed:', err.message);
  }
})();
