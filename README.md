# 404Stats Web

[![npm](https://img.shields.io/badge/npm-install%20%26%26%20build-red)](https://www.npmjs.com)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF)](https://vitejs.dev)

Official web dashboard template for the 404Stats Minecraft plugin. A dark-themed, Minecraft-inspired statistics dashboard that connects to a running 404Stats plugin instance via its internal HTTP API.

---

## Getting Started (Beginner's Guide)

You have **no coding experience**? No problem — you only need a terminal and 5 minutes.

### Step 1 — Install Node.js

Download and install Node.js (version 18 or newer) from [nodejs.org](https://nodejs.org). The LTS version is fine.

Verify it works:
```bash
node --version   # should print v18.x.x or higher
npm --version    # should print 9.x.x or higher
```

### Step 2 — Clone and Install

```bash
git clone https://github.com/404DiscNotFound/404Stats-Web.git
cd 404Stats-Web
npm install
```

### Step 3 — Start the Dev Server

```bash
npm run dev
```

Your browser opens at `http://localhost:5173`. You see the dashboard with **demo data** — no Minecraft server needed. Every number, chart, and player name is fictional. Perfect for exploring how 404Stats looks and feels.

### Step 4 — Connect to a Real Server

1. Make sure a Minecraft server with the [404Stats Plugin](https://github.com/404DiscNotFound/404Stats-Plugin) is running
2. The plugin's webserver runs on port `8088` by default
3. Open `http://<server-ip>:8088/server/local` in your browser — you see the **production dashboard** with real data, served directly from the plugin

### Step 5 — Build for Production

```bash
npm run build
```

The `dist/` folder now contains a complete static website. You can:

- **Upload it** to Netlify, Cloudflare Pages, or GitHub Pages
- **Point it** at your Minecraft server's API
- **Bundle it** into the plugin JAR (happens automatically when you build the plugin with this repo as sibling)

---

## How It Works

```
┌─────────────────────┐       HTTP API        ┌──────────────────┐
│  404Stats Plugin    │ ◄────────────────────► │  404Stats Web    │
│  (Minecraft Server) │    POST / JSON          │  (This Project)  │
└─────────────────────┘                         └──────────────────┘
```

The plugin collects stats in-game and exposes them through a local HTTP API (port 8088). The web dashboard sends `POST` requests to this API and renders the responses as charts, tables, and player cards.

Two JS files control the data flow:

| File | Mode | Data Source |
|------|------|-------------|
| `app.js` | Production | Real API calls to the plugin's webserver |
| `demo.js` | Demo | Static JSON files in `demo-data/` |

Both files share the same rendering logic — only the network layer differs.

---

## Project Structure

```
404Stats-Web/
├── src/
│   ├── index.html         # Production dashboard HTML
│   ├── admin.html         # Admin panel HTML
│   ├── demo.html          # Standalone demo page
│   ├── styles.css         # Main stylesheet (Minecraft design system)
│   ├── admin.css          # Admin panel styles
│   └── public/            # Static assets (copied to dist/ unchanged)
│       ├── app.js         # Production JS — real API calls
│       ├── app.local.js   # Alias for backward compatibility
│       ├── demo.js        # Demo JS — static data, no server needed
│       ├── admin.js       # Admin panel JS
│       ├── fonts/         # Minecraft Ten & Regular fonts
│       ├── demo-data/     # ~100 static JSON responses for demo mode
│       ├── logo-404.svg   # 404Stats logo
│       ├── default-server-icon.svg
│       ├── server-icon.png
│       ├── manifest.json  # PWA manifest
│       └── service-worker.js
├── docs/
│   ├── API.md             # Full API endpoint reference
│   └── README.md          # Developer guide — build your own frontend
├── package.json
├── vite.config.js
└── postbuild.js           # Fixes CSS filenames after multi-page build
```

---

## Customizing for Your Server

### Change Colors, Fonts, Text

All visual design lives in `src/styles.css`. The root variables on lines 22-31 control the entire color scheme:

```css
:root {
  --mc-bg: #121213;        /* Page background */
  --mc-surface: #313233;   /* Card backgrounds */
  --mc-green: #5BA033;     /* Accent color */
  --mc-text: #FFFFFF;      /* Default text */
  ...
}
```

Change these values and the entire dashboard updates.

### Replace the Logo

Swap `src/public/logo-404.svg` with your own SVG.

### Connect to a Different API

If you want the dashboard to talk to a non-404Stats backend, edit `src/public/app.js` — specifically the `post()` function (line ~21):

```js
async function post(url, payload = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  ...
}
```

Replace this with your own API client. The responses must follow the [API](docs/API.md) format, or you'll need to adjust the rendering code below.

### Add Your Own Demo Data

Create new JSON files in `src/public/demo-data/` and reference them from `src/public/demo.js`. This lets you preview specific scenarios without a real server.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server with demo data |
| `npm run build` | Build static site into `dist/` |
| `npm run preview` | Preview the built site locally |

---

## Deploying

Upload the `dist/` folder to any static host:

- **Netlify** — Drag & drop `dist/`, `_redirects` handles routing automatically
- **Cloudflare Pages** — Connect the repo, build command `npm run build`, output directory `dist`
- **GitHub Pages** — Use the `gh-pages` branch, point to `/docs` or `dist/`

The deployed site will try to connect to the 404Stats API on the origin where the page is served. For a production setup, configure the public URL in the plugin's `webserver.yml` and point your frontend at it.

---

## Upgrading the Plugin's Web Dashboard

When you clone this repo next to the [404Stats-Plugin](https://github.com/404DiscNotFound/404Stats-Plugin) repo in a shared workspace, the plugin build automatically picks up your customized web files:

```
404Stats/
├── 404Stats-Plugin/    ← builds the plugin JAR
└── 404Stats-Web/       ← builds the web dashboard
```

Running `./gradlew build` inside `404Stats-Plugin` will:
1. Detect `../404Stats-Web`
2. Run `npm install && npm run build` there
3. Bundle `dist/` into the JAR under `/web/`

This means you can customize the web dashboard, rebuild the plugin, and your custom UI ships inside the plugin JAR.

---

## Developer Guide

Want to build your own frontend from scratch against the 404Stats API? Read the [Developer Guide](docs/README.md) and the [API Reference](docs/API.md).

---

## License

All Rights Reserved — 404DiscNotFound
