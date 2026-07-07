# 404Stats API

404Stats exposes a local HTTP API on the webserver port (default `8088`). All API endpoints use POST requests with JSON payloads and return JSON responses.

## Base URL

```
http://<server>:8088
```

## General Response Format

All successful responses contain:

```json
{
  "success": true,
  ...
}
```

Error responses contain:

```json
{
  "success": false,
  "error": "Error message"
}
```

Password-protected panels return:

```json
{
  "success": false,
  "password_required": true,
  "error": "Password required"
}
```

---

## Blocks Module

### `POST /api/functions/getServerData`

Get aggregated block statistics for a specific game mode.

**Request:**
```json
{
  "game_mode": "SURVIVAL"
}
```

**Parameters:**
| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `game_mode` | string | `SURVIVAL`, `CREATIVE`, `ALL` | Filter by game mode |

**Response:**
```json
{
  "success": true,
  "server": { "name": "My Server" },
  "summary": {
    "mined": 12345,
    "placed": 6789,
    "total": 19134,
    "players": 25
  },
  "material_categories": [
    { "name": "stone", "count": 5000 }
  ],
  "world_distribution": [
    { "display_name": "world", "count": 15000 }
  ],
  "fun_facts": [
    { "text": "Most mined block: stone", "value": "8,234" }
  ],
  "trend": [
    { "date": "2025-01-01", "mined": 100, "placed": 50 }
  ],
  "top_blocks": [
    { "material": "stone", "count": 5000, "mined": 4000, "placed": 1000 }
  ],
  "top_miners": [
    { "player_name": "Steve", "uuid": "...", "count": 2000 }
  ],
  "top_builders": [
    { "player_name": "Alex", "uuid": "...", "count": 1500 }
  ]
}
```

### `POST /api/functions/getPlayerData`

Get block statistics for a specific player.

**Request:**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440001",
  "game_mode": "SURVIVAL"
}
```

### `POST /api/functions/searchPlayers`

Search players by name.

**Request:**
```json
{
  "query": "Steve"
}
```

### `POST /api/functions/getBlockIndex`

Get the full block index with display names.

---

## NPC Combat Module

### `POST /api/functions/getEntityData`

Get aggregated entity/combat statistics.

**Request:**
```json
{
  "entity_group": "ALL",
  "game_mode": "SURVIVAL"
}
```

**Parameters:**
| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `entity_group` | string | `ALL`, `HOSTILE`, `PASSIVE`, `BOSS` | Entity category filter |
| `game_mode` | string | `SURVIVAL`, `CREATIVE`, `ALL` | Game mode filter |

**Response:**
```json
{
  "success": true,
  "server": { "name": "My Server" },
  "summary": {
    "kills": 5000,
    "deaths": 200,
    "total": 5200,
    "players": 20,
    "entity_types": 50
  },
  "world_distribution": [ ... ],
  "game_mode_distribution": [ ... ],
  "top_entities": [
    {
      "entity_type": "zombie",
      "display_name": "Zombie",
      "kills": 1000,
      "deaths": 5
    }
  ],
  "top_killers": [ ... ],
  "top_deaths": [ ... ],
  "top_kill_items": [ ... ],
  "top_death_items": [ ... ]
}
```

### `POST /api/functions/getEntityPlayerData`

Get entity stats for a specific player.

**Request:**
```json
{
  "uuid": "...",
  "entity_group": "ALL",
  "game_mode": "SURVIVAL"
}
```

### `POST /api/functions/searchEntityPlayers`

Search players by name within entity stats.

---

## Movement Module

### `POST /api/functions/getMovementData`

Get aggregated movement statistics.

**Request:**
```json
{
  "game_mode": "SURVIVAL"
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "distance_cm": 123456789,
    "players": 20,
    "event_count": 5000
  },
  "type_distribution": [
    { "display_name": "Walking", "movement_type": "WALK", "distance_cm": 50000 }
  ],
  "world_distribution": [ ... ],
  "biome_distribution": [ ... ],
  "game_mode_distribution": [ ... ],
  "top_players": [ ... ],
  "top_pilots": [ ... ],
  "top_sailors": [ ... ],
  "top_riders": [ ... ],
  "top_swimmers": [ ... ],
  "top_climbers": [ ... ],
  "top_fallers": [ ... ]
}
```

### `POST /api/functions/getMovementPlayerData`

Get movement stats for a specific player.

### `POST /api/functions/searchMovementPlayers`

Search players within movement stats.

---

## Production Module

### `POST /api/functions/getProductionData`

Get aggregated crafting/smelting/production statistics.

**Request:**
```json
{
  "game_mode": "SURVIVAL",
  "production_type": "ALL"
}
```

**Parameters:**
| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `production_type` | string | `ALL`, `CRAFT`, `SMELT`, `SMITH`, `STONECUT` | Production category |

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_amount": 50000,
    "total_actions": 8000,
    "unique_items": 200,
    "players": 15
  },
  "type_distribution": [ ... ],
  "station_distribution": [ ... ],
  "world_distribution": [ ... ],
  "game_mode_distribution": [ ... ],
  "top_items": [ ... ],
  "top_players": [ ... ],
  "fun_facts": [ ... ]
}
```

### `POST /api/functions/getProductionPlayerData`

Get production stats for a specific player.

### `POST /api/functions/searchProductionPlayers`

Search players within production stats.

---

## Interactions Module

### `POST /api/functions/getInteractionData`

Get interaction statistics (chests, doors, animals, buckets, etc.).

**Request:**
```json
{
  "interaction_group": "ALL",
  "game_mode": "SURVIVAL"
}
```

### `POST /api/functions/getInteractionPlayerData`

Get interaction stats for a specific player.

### `POST /api/functions/searchInteractionPlayers`

Search players within interaction stats.

---

## Worlds Module

### `POST /api/functions/getWorldList`

Get list of tracked worlds with dimension data.

### `POST /api/functions/getWorldData`

Get detailed stats for a specific world.

**Request:**
```json
{
  "world_name": "world"
}
```

---

## Projects

### `POST /api/functions/getProjects`

Get list of player projects.

### `POST /api/functions/getProjectData`

Get data for a specific project.

**Request:**
```json
{
  "project_slug": "my-project"
}
```

---

## Utility

### `POST /api/functions/ping`

Health check.

**Response:**
```json
{
  "success": true,
  "service": "404Stats Local Webserver",
  "storage": "local"
}
```

### `POST /api/functions/getModuleStatus`

Get which stat modules are enabled.

**Response:**
```json
{
  "success": true,
  "blocks": true,
  "npc_combat": true,
  "movement": true,
  "production": true,
  "interactions": true,
  "worlds": true
}
```

### `POST /api/functions/getLocalAuthStatus`

Check if the panel is password-protected.

### `POST /api/functions/verifyLocalPassword`

Verify panel password (when configured).

---

## Admin API

### `POST /api/admin/session`

Check current admin session.

### `POST /api/admin/summary`

Get database summary (requires admin session).

**Response:**
```json
{
  "success": true,
  "tables": [
    { "table": "block_stats", "rows": 124580, "latest": 1700000000000 }
  ],
  "total_rows": 200000,
  "db_size_mb": 45.2,
  "db_path": "plugins/404Stats/404stats.mv.db"
}
```

### `POST /api/admin/browse`

Browse raw database entries (requires admin session).

**Request:**
```json
{
  "table": "block_stats",
  "limit": 50,
  "search": "Steve"
}
```

### `POST /api/admin/delete-preview`

Preview deletion of entries (requires admin session).

### `POST /api/admin/delete-confirm`

Confirm deletion of entries (requires admin session, CSRF token).

### `POST /api/admin/logout`

End admin session.

---

## Static Assets

### `GET /assets/block/<material>.png`

Minecraft block texture icon (requires `use_minecraft_assets: true` in config).

### `GET /assets/entity/<type>.png`

Minecraft entity icon.

### `GET /assets/head/<uuid>.png?size=<pixels>`

Player head avatar (cached from Mojang session servers).
