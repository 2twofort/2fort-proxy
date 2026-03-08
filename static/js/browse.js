'use strict';

const frame  = document.getElementById('proxyFrame');
const barUrl = document.getElementById('barUrl');
const splash = document.getElementById('splash');

function getConfig() {
  try { return JSON.parse(localStorage.getItem('2fp-config')) || {}; } catch { return {}; }
}

function buildProxyUrl(raw) {
  if (window.__scramjet) return window.__scramjet.encodeUrl(raw);
  return '/2fort-proxy/service/' + btoa(raw);
}

function navigate(url) {
  let clean = url.trim();
  if (!clean) return;
  const isUrl = /^https?:\/\//i.test(clean) || /^[a-z0-9-]+\.[a-z]{2,}/i.test(clean);
  if (!isUrl) {
    clean = `https://www.google.com/search?q=${encodeURIComponent(clean)}`;
  } else if (!/^https?:\/\//i.test(clean)) {
    clean = 'https://' + clean;
  }
  barUrl.value = clean;
  setLock(clean);
  const proxied = buildProxyUrl(clean);
  frame.src = proxied;
  splash.style.display = 'none';
}

function setLock(url) {
  const lock = document.getElementById('barLock');
  if (!lock) return;
  lock.textContent = url.startsWith('https') ? '🔒' : '🔓';
}

function barGo() { navigate(barUrl.value); }
function frameBack()    { try { frame.contentWindow.history.back();    } catch {} }
function frameForward() { try { frame.contentWindow.history.forward(); } catch {} }
function frameReload()  { frame.src = frame.src; }
function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen();
}
function openNewTab() { window.open(window.location.href, '_blank'); }

frame.addEventListener('load', () => {
  try {
    const fUrl = frame.contentWindow.location.href;
    if (fUrl && fUrl !== 'about:blank') { barUrl.value = fUrl; setLock(fUrl); }
  } catch {}
});

barUrl.addEventListener('keydown', e => { if (e.key === 'Enter') barGo(); });

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const target = params.get('url');
  if (!target) return;
  const go = () => navigate(decodeURIComponent(target));
  if (window.__scramjet) go();
  else window.addEventListener('scramjet-ready', go, { once: true });
});
