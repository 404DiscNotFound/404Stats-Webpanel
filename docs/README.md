# Building a Custom 404Stats Frontend

This guide is for developers who want to build their own website, dashboard, bot, or mobile app that reads stats from a 404Stats plugin instance.

If you just want to customize the existing dashboard, start with the [main README](../README.md) and edit the template files — this guide is about building something from scratch.

## Architecture

```
┌───────────────────┐          ┌──────────────────────────────┐
│                   │  POST    │                              │
│  404Stats Plugin  │ ◄─────── │  Your Custom App / Website   │
│  (Paper/Spigot)   │  JSON    │                              │
│                   │ ────────►│                              │
└───────────────────┘          └──────────────────────────────┘
    Port 8088 (default)
```

Every request is a `POST` with a JSON body. Every response is JSON. There is no authentication for stats endpoints (optionally password-protected, see [API.md](API.md)).

## First Request — Ping

The simplest way to test connectivity:

```js
const response = await fetch('http://localhost:8088/api/functions/ping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
const data = await response.json();
console.log(data);
// { success: true, service: "404Stats Local Webserver", storage: "local" }
```

## Module Discovery

Ask the plugin which modules are active (some may be disabled in `config.yml`):

```js
const modules = await post('/api/functions/getModuleStatus', {});
// { success: true, blocks: true, npc_combat: true, movement: true, ... }
```

Only request data for enabled modules to avoid errors.

## Building a Dashboard Page

A typical dashboard page does three things:

### 1. Check if the server is online

```js
const ping = await post('/api/functions/ping');
if (!ping.success) throw new Error('Server offline');
```

### 2. Fetch module data

```js
const [blocks, combat, movement] = await Promise.all([
  post('/api/functions/getServerData', { game_mode: 'SURVIVAL' }),
  post('/api/functions/getEntityData', { entity_group: 'ALL', game_mode: 'ALL' }),
  post('/api/functions/getMovementData', { game_mode: 'ALL' })
]);
```

### 3. Render

Use the data to build charts, tables, and player cards. Here's how the responses are structured:

```js
// blocks.summary = { mined: 12345, placed: 6789, total: 19134, players: 25 }
// blocks.top_blocks = [{ material: "stone", count: 5000, ... }]
// blocks.top_miners = [{ player_name: "Steve", uuid: "...", count: 2000 }]
// blocks.top_builders = [{ player_name: "Alex", uuid: "...", count: 1500 }]
// blocks.world_distribution = [{ display_name: "world", count: 15000 }]
// blocks.material_categories = [{ name: "stone", count: 5000 }]
// blocks.trend = [{ date: "2025-01-01", mined: 100, placed: 50 }]

// combat.summary = { kills: 5000, deaths: 200, total: 5200, players: 20 }
// combat.top_entities = [{ entity_type: "zombie", display_name: "Zombie", kills: 1000 }]
// combat.top_killers = [{ player_name: "Steve", uuid: "...", kills: 800 }]
// combat.top_deaths = [{ player_name: "Alex", uuid: "...", deaths: 50 }]

// movement.summary = { distance_cm: 123456789, players: 20, event_count: 5000 }
// movement.type_distribution = [{ display_name: "Walking", movement_type: "WALK", distance_cm: 50000 }]
// movement.top_players = [{ player_name: "Steve", distance_cm: 50000000 }]
```

## Player Head Icons

The plugin serves player head PNGs from Mojang session servers:

```
GET /assets/head/<uuid>.png?size=30
```

Example:
```html
<img src="http://localhost:8088/assets/head/550e8400-e29b-41d4-a716-446655440001.png?size=30" />
```

Head requests are **cached locally** by the plugin. Invalid UUIDs return a 404.

## Block and Entity Icons

If `use_minecraft_assets: true` is set in the plugin config:

```
GET /assets/block/<material>.png
GET /assets/entity/<type>.png
```

Example:
```
GET /assets/block/stone.png
GET /assets/entity/zombie.png
```

If disabled, use emoji fallbacks instead — no external icons are served.

## Error Handling

```js
async function post(url, payload = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await response.json();

  if (!response.ok || json.success === false) {
    if (json.password_required) {
      // Panel is password-protected — show login form
      throw new Error('Password required');
    }
    throw new Error(json.error || `HTTP ${response.status}`);
  }

  return json;
}
```

Key patterns:
- All responses have a `success` field — check it even if HTTP status is 200
- `password_required: true` means the panel needs authentication
- Error messages are in `json.error`
- Responses are always JSON objects (never arrays at the top level)

## Building a Player Search

```js
async function searchPlayer(name) {
  const result = await post('/api/functions/searchPlayers', { query: name });
  // result.players = [{ player_name: "Steve", uuid: "..." }]
  return result.players || [];
}

// Then fetch their stats
const player = await post('/api/functions/getPlayerData', {
  uuid: '550e8400-e29b-41d4-a716-446655440001',
  game_mode: 'SURVIVAL'
});
// player.summary = { mined: 500, placed: 300, total: 800 }
// player.top_blocks = [{ material: "stone", count: 200 }]
```

## Game Mode Filtering

Most endpoints accept a `game_mode` parameter. Valid values:

| Value | Description |
|-------|-------------|
| `SURVIVAL` | Survival mode stats only (default) |
| `CREATIVE` | Creative mode stats only |
| `ALL` | Combined across all modes |

## Building the Admin Panel

Admin endpoints require a session token obtained via `/404stats webadmin` in-game. The login flow:

1. Player runs `/404stats webadmin` → a one-time URL is logged to console
2. Visit `http://localhost:8088/admin/login?token=...` → sets a session cookie
3. Now all `/api/admin/*` endpoints are accessible

Admin endpoints require the session cookie and may also need CSRF tokens for destructive operations. See [API.md](API.md) for the full admin API.

## Design Tips

- **Dark by default** — Minecraft servers run in dark rooms. Use `#121213` as background, `#FFFFFF` for text
- **Large numbers** — Make total counts prominent and scannable
- **Player names over UUIDs** — Always display `player_name` alongside heads
- **Donuts and bars** — Charts render well with the dark theme (avoid light/white chart backgrounds)
- **Mobile-friendly** — Server admins often check stats on their phone. 404Stats uses `viewport-fit=cover`
- **No spinners or sync indicators** — The data is local, there is no cloud. Loading should feel instant

## Full API Reference

See [API.md](API.md) for every endpoint, request parameter, and response field.
