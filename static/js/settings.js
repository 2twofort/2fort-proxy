/* settings.js — 2Fort Proxy settings page */
'use strict';

function getConfig() {
  try { return JSON.parse(localStorage.getItem('2fp-config')) || {}; } catch { return {}; }
}
function setConfig(cfg) {
  localStorage.setItem('2fp-config', JSON.stringify(cfg));
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 2400);
}

// ── Load saved values into fields ────────────────────────────
function loadFields() {
  const cfg = getConfig();
  document.getElementById('backendUrl').value = cfg.backendUrl || '';
  document.getElementById('uvPrefix').value   = cfg.uvPrefix   || '/service/';
  document.getElementById('barePath').value   = cfg.barePath   || '/bare/';
  document.getElementById('cloakTitle').value = cfg.cloakTitle || '';
  document.getElementById('cloakIcon').value  = cfg.cloakIcon  || '';
  document.getElementById('panicKey').value   = cfg.panicKey   || '';
  document.getElementById('panicUrl').value   = cfg.panicUrl   || 'https://google.com';
  document.getElementById('togScanlines').checked  = cfg.scanlines  !== false;
  document.getElementById('togPanicClose').checked = !!cfg.panicClose;
}

// ── Save backend ──────────────────────────────────────────────
function saveBackend() {
  const cfg = getConfig();
  cfg.backendUrl = document.getElementById('backendUrl').value.trim().replace(/\/$/, '');
  cfg.uvPrefix   = document.getElementById('uvPrefix').value.trim() || '/service/';
  cfg.barePath   = document.getElementById('barePath').value.trim() || '/bare/';
  setConfig(cfg);
  showToast('BACKEND SETTINGS SAVED', 'ok');
}

// ── Test backend connection ───────────────────────────────────
async function testBackend() {
  const box = document.getElementById('backendStatus');
  const cfg = getConfig();
  const url = cfg.backendUrl;
  if (!url) { box.textContent = 'No backend URL configured.'; return; }

  box.textContent = 'Testing connection…';
  try {
    const r = await fetch(url + (cfg.barePath || '/bare/'), {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    if (r.ok || r.status < 500) {
      box.innerHTML = '<span style="color:var(--green)">✔ Connected! Status ' + r.status + '</span>';
      showToast('CONNECTION OK', 'ok');
    } else {
      throw new Error('HTTP ' + r.status);
    }
  } catch (e) {
    box.innerHTML = '<span style="color:var(--red)">✘ Failed: ' + e.message + '</span>';
    showToast('CONNECTION FAILED', 'err');
  }
}

// ── Save appearance ───────────────────────────────────────────
function saveAppearance() {
  const cfg = getConfig();
  cfg.cloakTitle = document.getElementById('cloakTitle').value.trim();
  cfg.cloakIcon  = document.getElementById('cloakIcon').value;
  cfg.scanlines  = document.getElementById('togScanlines').checked;
  setConfig(cfg);
  // Apply immediately
  if (cfg.cloakTitle) document.title = cfg.cloakTitle;
  const scanEl = document.querySelector('.scanlines');
  if (scanEl) scanEl.style.display = cfg.scanlines ? '' : 'none';
  showToast('APPEARANCE SAVED', 'ok');
}

// ── Capture panic key ─────────────────────────────────────────
function capturePanic(e) {
  e.preventDefault();
  document.getElementById('panicKey').value = e.key;
}

function savePanic() {
  const cfg = getConfig();
  cfg.panicKey   = document.getElementById('panicKey').value;
  cfg.panicUrl   = document.getElementById('panicUrl').value.trim() || 'https://google.com';
  cfg.panicClose = document.getElementById('togPanicClose').checked;
  setConfig(cfg);
  showToast('PANIC KEY SAVED', 'ok');
}

// ── Service Worker management ─────────────────────────────────
async function checkSW() {
  const box = document.getElementById('swStatusBox');
  if (!('serviceWorker' in navigator)) {
    box.textContent = 'Service Workers not supported in this browser.';
    return;
  }
  const regs = await navigator.serviceWorker.getRegistrations();
  if (regs.length === 0) {
    box.innerHTML = '<span style="color:var(--red)">✘ No service worker registered.</span>';
  } else {
    box.innerHTML = regs.map(r =>
      `<span style="color:var(--green)">✔ Active — scope: ${r.scope}</span>`
    ).join('<br/>');
  }
}

async function reregSW() {
  const cfg     = getConfig();
  const swPath  = cfg.swPath  || '/uv/sw.js';
  const scope   = cfg.uvPrefix || '/service/';
  try {
    await navigator.serviceWorker.register(swPath, { scope });
    showToast('SW REGISTERED', 'ok');
    checkSW();
  } catch (e) {
    showToast('SW FAILED: ' + e.message, 'err');
  }
}

async function unregSW() {
  if (!confirm('Unregister service worker? Proxy will stop working.')) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) await r.unregister();
  showToast('SW UNREGISTERED', 'err');
  checkSW();
}

// ── Init ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadFields();
  checkSW();
});
