/* browse.js — 2Fort Proxy browser chrome */
'use strict';

const frame  = document.getElementById('proxyFrame');
const barUrl = document.getElementById('barUrl');
const splash = document.getElementById('splash');

function getConfig() {
  try { return JSON.parse(localStorage.getItem('2fp-config')) || {}; } catch { return {}; }
}

// Build the proxied URL using UV prefix
function buildProxyUrl(raw) {
  const cfg    = getConfig();
  const prefix = cfg.uvPrefix || '/service/';
  // UV encodes the URL using its own codec injected by the SW
  // At runtime with the SW active, we just navigate to prefix + encoded URL
  // The SW will intercept and forward to the bare server.
  // Without __uv$config injected by the SW bundle, we use a basic btoa approach:
  if (window.__uv$config && typeof __uv$config.encodeUrl === 'function') {
    return prefix + __uv$config.encodeUrl(raw);
  }
  // Fallback: simple base64 (works if backend uses UV with xor=0)
  return prefix + btoa(raw);
}

function navigate(url) {
  let clean = url.trim();
  if (!clean) return;
  // Detect search vs URL
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
  hideSplash();
}

function hideSplash() {
  splash.classList.add('hidden');
}

function setLock(url) {
  const lock = document.getElementById('barLock');
  if (!lock) return;
  lock.textContent = url.startsWith('https') ? '🔒' : '🔓';
  lock.title = url.startsWith('https') ? 'Secure' : 'Not secure';
}

function barGo() {
  navigate(barUrl.value);
}

function frameBack()    { try { frame.contentWindow.history.back();    } catch {} }
function frameForward() { try { frame.contentWindow.history.forward(); } catch {} }
function frameReload()  { frame.src = frame.src; }

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

function openNewTab() {
  window.open(window.location.href, '_blank');
}

// Try to track frame URL changes (cross-origin will silently fail — that's fine)
frame.addEventListener('load', () => {
  try {
    const fUrl = frame.contentWindow.location.href;
    if (fUrl && fUrl !== 'about:blank') {
      barUrl.value = fUrl;
      setLock(fUrl);
    }
  } catch {
    // Cross-origin: leave bar as-is
  }
});

// URL bar Enter key
barUrl.addEventListener('keydown', e => {
  if (e.key === 'Enter') barGo();
});

// ── Panic key ────────────────────────────────────────────────
function setupPanic() {
  const cfg = getConfig();
  if (!cfg.panicKey) return;
  document.addEventListener('keydown', e => {
    if (e.key === cfg.panicKey) {
      if (cfg.panicClose) window.close();
      else window.location.href = cfg.panicUrl || 'https://google.com';
    }
  });
}

// ── Cloaking ─────────────────────────────────────────────────
function applyCloaking() {
  const cfg = getConfig();
  if (cfg.cloakTitle) document.title = cfg.cloakTitle;
  if (cfg.cloakIcon) {
    let link = document.querySelector("link[rel='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = cfg.cloakIcon;
  }
}

// ── Init ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  applyCloaking();
  setupPanic();

  // If URL was passed via query string (from home/apps pages)
  const params = new URLSearchParams(window.location.search);
  const target = params.get('url');
  if (target) {
    navigate(decodeURIComponent(target));
  }
});
