# 2Fort Proxy

> *Capture the Intel. Capture the Web.*

A TF2-styled web proxy frontend compatible with [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet). The frontend (this repo) lives on GitHub Pages. A lightweight Node.js backend runs on a Google Cloud VM to handle the actual proxying.

---

## How It Works

```
Browser → GitHub Pages (frontend + Service Worker)
              ↓  all requests intercepted by SW
        Google VM (bare-server-node + UV handler)
              ↓
         The real internet
```

The Service Worker on the client intercepts every request and rewrites it through your VM's `/service/` prefix. The bare server on your VM strips identifying headers and fetches the real page.

---

## Part 1 — Deploy the Frontend to GitHub Pages

### 1. Fork / Upload this repo

1. Go to [github.com](https://github.com) and create a new repository named `2Fort-Proxy` (or anything you want).
2. Upload all files from this folder, preserving the directory structure.

### 2. Enable GitHub Pages

1. In your repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `(root)`
4. Click **Save**

Your site will be live at:
```
https://YOUR-USERNAME.github.io/2Fort-Proxy/
```

---

## Part 2 — Set Up the Google Cloud VM (Backend)

### Step 1 — Create the VM

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Navigate to **Compute Engine → VM Instances → Create Instance**

**Recommended settings:**

| Setting | Value |
|---|---|
| Name | `2fort-proxy-backend` |
| Region | Closest to your users (e.g. `us-central1`) |
| Machine type | **e2-micro** (free tier eligible) or e2-small |
| Boot disk | **Ubuntu 22.04 LTS**, 20 GB standard |
| Firewall | ✅ Allow HTTP traffic, ✅ Allow HTTPS traffic |

3. Click **Create**.

### Step 2 — Reserve a Static IP (optional but recommended)

1. Go to **VPC Network → IP Addresses → Reserve External Static Address**
2. Attach it to your VM instance.

### Step 3 — SSH into your VM

Click the **SSH** button next to your VM in the console, or connect via:
```bash
gcloud compute ssh 2fort-proxy-backend
```

### Step 4 — Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # should print v20.x.x
```

### Step 5 — Install and configure the backend

```bash
mkdir ~/2fort-backend && cd ~/2fort-backend
npm init -y
npm install @tomphttp/bare-server-node express
```

Create the server file:

```bash
nano server.js
```

Paste this:

```javascript
const http    = require('http');
const express = require('express');
const { createBareServer } = require('@tomphttp/bare-server-node');

const app  = express();
const bare = createBareServer('/bare/');
const port = process.env.PORT || 8080;

// Serve UV static files
app.use(express.static('public'));

// Health check
app.get('/', (req, res) => res.send('2Fort Proxy backend running'));

const server = http.createServer();

server.on('request', (req, res) => {
  if (bare.shouldRoute(req)) bare.routeRequest(req, res);
  else app(req, res);
});

server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req)) bare.routeUpgrade(req, socket, head);
  else socket.end();
});

server.listen(port, () => console.log(`2Fort backend listening on :${port}`));
```

Save and exit (`Ctrl+X`, `Y`, `Enter`).

### Step 6 — Install Ultraviolet files

```bash
mkdir -p public/uv public/service
npm install @titaniumnetwork-dev/ultraviolet
cp node_modules/@titaniumnetwork-dev/ultraviolet/dist/* public/uv/
```

Edit `public/uv/uv.config.js` so it reads:

```javascript
self.__uv$config = {
  prefix:    '/service/',
  bare:      '/bare/',
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler:   '/uv/uv.handler.js',
  bundle:    '/uv/uv.bundle.js',
  config:    '/uv/uv.config.js',
  sw:        '/uv/sw.js',
};
```

### Step 7 — Open the firewall port

In Google Cloud Console:
1. **VPC Network → Firewall → Create Firewall Rule**
2. Name: `allow-8080`
3. Targets: All instances
4. Source IP ranges: `0.0.0.0/0`
5. Protocols and ports: TCP `8080`
6. Click **Create**

Or if using port 80/443 (recommended), no extra rule needed.

### Step 8 — Run the server

For a quick test:
```bash
node server.js
```

For persistent running (survives SSH disconnect), use PM2:
```bash
sudo npm install -g pm2
pm2 start server.js --name 2fort
pm2 save
pm2 startup   # follow the printed command
```

Your backend is now live at:
```
http://YOUR-VM-EXTERNAL-IP:8080
```

---

## Part 3 — Connect Frontend to Backend

1. Open your GitHub Pages site
2. Go to **Settings** tab
3. Enter your backend URL: `http://YOUR-VM-IP:8080`
4. UV Prefix: `/service/`
5. Bare Path: `/bare/`
6. Click **SAVE**, then **TEST CONNECTION** — it should go green ✔
7. Go back to **Home** and try browsing!

---

## Part 4 — (Optional) Add HTTPS with a Domain

For HTTPS (recommended — some sites require it):

1. Point a domain/subdomain to your VM's IP via an A record.
2. SSH into the VM and install Caddy:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

3. Create a Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

```
proxy.yourdomain.com {
    reverse_proxy localhost:8080
}
```

4. `sudo systemctl restart caddy` — Caddy auto-issues a free TLS cert.

Now update Settings with `https://proxy.yourdomain.com`.

---

## File Structure

```
2Fort-Proxy/
├── index.html          ← Home / search page
├── browse.html         ← Proxy browser frame
├── apps.html           ← Pinned shortcuts
├── settings.html       ← Backend config & privacy
├── 404.html            ← Custom GitHub Pages 404
├── logo.png            ← TF2 logo (transparent)
├── uv/
│   └── uv.config.js    ← UV config template
└── static/
    ├── css/
    │   ├── style.css   ← Main TF2 stylesheet
    │   └── browse.css  ← Browser chrome styles
    └── js/
        ├── main.js         ← Home page logic
        ├── register-sw.js  ← Service Worker registration
        ├── browse.js       ← Proxy browser logic
        └── settings.js     ← Settings page logic
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Service Worker not registering | Make sure you're on HTTPS or localhost |
| Backend test fails | Check VM firewall rules, confirm port 8080 is open |
| Pages load but look broken | UV files missing in `public/uv/` on backend |
| "Failed to fetch" errors | Backend URL is wrong or server isn't running |
| SW scope error | Ensure `uv.config.js` prefix matches `/service/` |

---

*Built with the spirit of 2Fort. CAPTURE THE INTEL.*
