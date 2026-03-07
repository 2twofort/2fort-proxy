/* main.js — 2Fort Proxy home page */
'use strict';

// ── Helpers ──────────────────────────────────────────────────
function getConfig() {
  try { return JSON.parse(localStorage.getItem('2fp-config')) || {}; } catch { return {}; }
}

function fill(url) {
  document.getElementById('searchInput').value = url;
  document.getElementById('searchInput').focus();
}

function go(url) {
  const cfg = getConfig();
  const prefix = cfg.uvPrefix || '/service/';
  const backend = cfg.backendUrl || '';
  window.location.href = `browse.html?url=${encodeURIComponent(url)}`;
}

function doNavigate() {
  let val = document.getElementById('searchInput').value.trim();
  if (!val) return;

  // If it looks like a URL, navigate; otherwise wrap in Google search
  const isUrl = /^https?:\/\//i.test(val) || /^[a-z0-9-]+\.[a-z]{2,}/i.test(val);
  if (!isUrl) {
    val = `https://www.google.com/search?q=${encodeURIComponent(val)}`;
  } else if (!/^https?:\/\//i.test(val)) {
    val = 'https://' + val;
  }

  window.location.href = `browse.html?url=${encodeURIComponent(val)}`;
}

// ── Service Worker status ─────────────────────────────────────
async function checkSW() {
  const dot  = document.getElementById('swDot');
  const text = document.getElementById('swText');
  if (!('serviceWorker' in navigator)) {
    dot.style.background = 'var(--red)';
    text.textContent = 'SERVICE WORKER: NOT SUPPORTED';
    return;
  }
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    if (regs.length > 0) {
      dot.style.cssText = 'background:var(--green);box-shadow:0 0 6px var(--green)';
      dot.style.animation = 'pulse-dot 2s infinite';
      text.textContent = 'SERVICE WORKER: ACTIVE';
    } else {
      dot.style.background = 'var(--red)';
      text.textContent = 'SERVICE WORKER: NOT REGISTERED';
    }
  } catch {
    dot.style.background = 'var(--red)';
    text.textContent = 'SERVICE WORKER: ERROR';
  }
}

// ── Backend status ────────────────────────────────────────────
async function checkBackend() {
  const dot  = document.getElementById('proxyDot');
  const text = document.getElementById('proxyText');
  const cfg  = getConfig();
  const url  = cfg.backendUrl;

  if (!url) {
    text.textContent = 'BACKEND: NOT CONFIGURED';
    return;
  }

  text.textContent = 'BACKEND: TESTING…';
  try {
    const r = await fetch(url + (cfg.barePath || '/bare/'), { method: 'GET', signal: AbortSignal.timeout(4000) });
    if (r.ok || r.status < 500) {
      dot.style.cssText = 'background:var(--green);box-shadow:0 0 6px var(--green)';
      text.textContent = 'BACKEND: CONNECTED (' + url + ')';
    } else {
      throw new Error('status ' + r.status);
    }
  } catch (e) {
    dot.style.background = 'var(--red)';
    text.textContent = 'BACKEND: UNREACHABLE';
  }
}

// ── Panic key ────────────────────────────────────────────────
function setupPanic() {
  const cfg = getConfig();
  if (!cfg.panicKey) return;
  document.addEventListener('keydown', e => {
    if (e.key === cfg.panicKey) {
      if (cfg.panicClose) { window.close(); }
      else { window.location.href = cfg.panicUrl || 'https://google.com'; }
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
  if (cfg.scanlines === false) {
    const el = document.querySelector('.scanlines');
    if (el) el.style.display = 'none';
  }
}

// ── Init ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  applyCloaking();
  setupPanic();
  checkSW();
  checkBackend();
});
