console.log('404Stats Local app blockindex-1 loaded');

const $ = (id) => document.getElementById(id);
const app = () => $('app');
let currentMode = 'SURVIVAL';
let blockFilter = 'TOTAL';
let currentProjectRange = 'ALL_TIME';
let entityGroup = 'ALL';
let currentEntityMode = 'ALL';
let currentProductionType = 'ALL';
let movementUnit = localStorage.getItem('404stats_movement_unit') || 'km';
let searchTimer = null;
let moveSearchTimer = null;
let prodSearchTimer = null;
let currentInteractGroup = 'ALL';
let interactSearchTimer = null;
const APP_VERSION = '0.3a';
const colors = ['#5BA033', '#3BAA90', '#C0392B', '#D4A017', '#8B4FE8', '#6A7A8A'];
let assetStatus = { minecraftAssetsEnabled: true, iconMode: 'textures' };

async function post(url, payload = {}) {
  const file = demoRoute(url, payload) || 'ping.json';
  const response = await fetch('demo-data/' + file);
  if (!response.ok) throw new Error('Demo data not found: ' + file);
  const text = await response.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch (e) { throw new Error(text || e.message); }
  updateAssetStatus(json.assets);
  return json;
}

function demoRoute(url, payload = {}) {
  if (url.includes('getServerData')) {
    const mode = (payload.game_mode || payload.mode || 'SURVIVAL').toLowerCase();
    return 'getServerData_' + mode + '.json';
  }
  if (url.includes('getPlayerData')) {
    const key = payload.uuid || payload.player || '';
    if (key) return 'getPlayerData_' + key + '.json';
    return 'getPlayerData_550e8400-e29b-41d4-a716-446655440001.json';
  }
  if (url.includes('getEntityPlayerData')) {
    const key = payload.uuid || payload.player || '';
    if (key) return 'getEntityPlayerData_' + key + '.json';
    return 'getEntityPlayerData_550e8400-e29b-41d4-a716-446655440001.json';
  }
  if (url.includes('getMovementPlayerData')) {
    const key = payload.uuid || payload.player || '';
    if (key) return 'getMovementPlayerData_' + key + '.json';
    return 'getMovementPlayerData_550e8400-e29b-41d4-a716-446655440001.json';
  }
  if (url.includes('getProductionPlayerData')) {
    const key = payload.uuid || payload.player || '';
    if (key) return 'getProductionPlayerData_' + key + '.json';
    return 'getProductionPlayerData_550e8400-e29b-41d4-a716-446655440001.json';
  }
  if (url.includes('getInteractionPlayerData')) {
    const key = payload.uuid || payload.player || '';
    if (key) return 'getInteractionPlayerData_' + key + '.json';
    return 'getInteractionPlayerData_550e8400-e29b-41d4-a716-446655440001.json';
  }
  if (url.includes('getWorldData')) {
    const key = payload.world_name || 'world';
    return 'getWorldData_' + key + '.json';
  }
  if (url.includes('getProjectData')) {
    const key = payload.project_slug || 'stonecastle';
    return 'getProjectData_' + key + '.json';
  }
  if (url.includes('getEntityData')) return 'getEntityData.json';
  if (url.includes('getMovementData')) return 'getMovementData.json';
  if (url.includes('getProductionData')) return 'getProductionData.json';
  if (url.includes('getInteractionData')) return 'getInteractionData.json';
  if (url.includes('getWorldList')) return 'getWorldList.json';
  if (url.includes('getProjects')) return 'getProjects.json';
  if (url.includes('getBlockIndex')) return 'getBlockIndex.json';
  if (url.includes('getModuleStatus')) return 'getModuleStatus.json';
  if (url.includes('getLocalAuthStatus')) return 'getLocalAuthStatus.json';
  if (url.includes('searchInteractionPlayers')) return 'searchInteractionPlayers.json';
  if (url.includes('searchProductionPlayers')) return 'searchProductionPlayers.json';
  if (url.includes('searchMovementPlayers')) return 'searchMovementPlayers.json';
  if (url.includes('searchEntityPlayers')) return 'searchEntityPlayers.json';
  if (url.includes('searchPlayers')) return 'searchPlayers.json';
  if (url.includes('ping')) return 'ping.json';
  return 'ping.json';
}

function esc(value = '') {
  return String(value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}
function attr(value = '') { return esc(value).replace(/'/g, '&#39;'); }
function fmt(value = 0) {
  const n = Number(value || 0);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return n.toLocaleString('en-US');
}
function fmtFull(value = 0) { return Number(value || 0).toLocaleString('en-US'); }
function unitSymbol() { return movementUnit === 'mi' ? 'mi' : 'km'; }
function distMultiplier() { return movementUnit === 'mi' ? 0.0000062137 : 0.00001; }
function num(cm) { const n = Number(cm); return isNaN(n) || !isFinite(n) ? 0 : n; }
function fmtDist(cm) {
  const v = num(cm) * distMultiplier();
  if (v < 0.01) return '<0.01';
  return v.toFixed(v >= 100 ? 0 : 2);
}
function fmtDistFull(cm) {
  const v = num(cm) * distMultiplier();
  if (v < 0.01) return '<0.01 ' + unitSymbol();
  return (v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2)) + ' ' + unitSymbol();
}
function fmtDistM(cm) {
  const m = num(cm) / 100;
  if (m < 0.01) return '<0.01 m';
  return (m >= 100 ? Math.round(m).toLocaleString('en-US') : m.toFixed(2)) + ' m';
}
function fmtDistItem(cm) {
  const v = num(cm) * distMultiplier();
  if (v < 0.01) return '<0.01 ' + unitSymbol();
  if (v >= 10) return Math.round(v).toLocaleString('en-US') + ' ' + unitSymbol();
  return v.toFixed(2) + ' ' + unitSymbol();
}
function fmtMovementSummaryLabel(cm) {
  const n = num(cm);
  return n > 0 ? fmtDistFull(n) : '0 ' + unitSymbol();
}
function moveTypeDist(types = [], keys = []) {
  let total = 0;
  for (const t of types) {
    if (t && keys.includes(t.movement_type)) total += num(t.distance_cm);
  }
  return total;
}
function moveTypeEvent(types = [], key = '') {
  for (const t of types) {
    if (t.movement_type === key) return t.event_count || 0;
  }
  return 0;
}
function unitToggle(reload) {
  setTimeout(() => bindUnitToggle(reload), 0);
  const units = [['km', 'Kilometers'], ['mi', 'Miles']];
  return `<div class="seg unit-toggle">${units.map(([value, label]) => `<button data-unit="${value}" class="${movementUnit === value ? 'active' : ''}">${label}</button>`).join('')}</div>`;
}
function bindUnitToggle(reload) {
  document.querySelectorAll('.unit-toggle button').forEach(button => {
    button.onclick = () => {
      movementUnit = button.dataset.unit;
      localStorage.setItem('404stats_movement_unit', movementUnit);
      if (reload) reload();
    };
  });
}
function tone(mode) { return mode === 'CREATIVE' ? 'creative' : mode === 'ALL' ? 'all' : 'survival'; }
function header(name, path) {
  $('serverName').textContent = name || '404Stats Local';
  $('serverPath').textContent = path || '/server/local';
  const badge = $('versionBadge');
  if (badge) badge.textContent = APP_VERSION;
}
function toast(message) {
  const t = $('toast');
  if (!t) return;
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}
function updateAssetStatus(assets = {}) {
  if (!assets || typeof assets !== 'object') return;
  assetStatus = {
    minecraftAssetsEnabled: Boolean(assets.minecraft_assets_enabled),
    iconMode: assets.icon_mode || (assets.minecraft_assets_enabled ? 'textures' : 'emoji')
  };
}
function assetNotice() {
  if (assetStatus.iconMode !== 'emoji') return '';
  return `<section class="asset-notice"><strong>Emoji block icons active</strong><span>Minecraft texture icons are disabled in <code>config.yml</code>. 404Stats is using privacy- and license-friendly emoji icons instead.</span></section>`;
}
async function checkAuthAndLoad() {
  try {
    const status = await post('/api/functions/getLocalAuthStatus');
    if (status.password_required && !status.authenticated) {
      renderLogin();
      return;
    }
    load();
  } catch (e) {
    load();
  }
}
function renderLogin(error = '') {
  header('404Stats Local', '/server/local');
  app().innerHTML = `<section class="login-shell"><article class="panel login-panel"><span class="login-kicker">Protected Local Panel</span><h2>Password required</h2><p>This local 404Stats panel uses the password from <code>webpanel.password</code>.</p><form id="loginForm"><input id="passwordInput" type="password" autocomplete="current-password" placeholder="Web panel password" autofocus/><button type="submit">Unlock</button></form>${error ? `<p class="login-error">${esc(error)}</p>` : ''}</article></section>`;
  const form = $('loginForm');
  const input = $('passwordInput');
  form.onsubmit = async (event) => {
    event.preventDefault();
    try {
      await post('/api/functions/verifyLocalPassword', { password: input.value });
      toast('Panel unlocked.');
      load();
    } catch (e) {
      renderLogin(e.message);
    }
  };
}
function playerHead(uuid = '', name = '', size = 'mini') {
  const cleanUuid = String(uuid || '').replace(/[^a-fA-F0-9-]/g, '');
  const initials = esc((name || '?').slice(0, 2).toUpperCase());
  if (!cleanUuid) return `<span class="avatar-fallback">${initials}</span>`;
  const pixels = size === 'big' ? 72 : 30;
  return `<img class="player-head ${size}" src="/assets/head/${attr(cleanUuid)}.png?size=${pixels}" alt="${attr(name || 'Player')} head" loading="lazy" onerror="this.replaceWith(document.createRange().createContextualFragment('<span class=&quot;avatar-fallback&quot;>${initials}</span>'))">`;
}
function blockTexture(material = '') {
  const id = String(material || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!id) return 'barrier';
  if (id.endsWith('_wall_sign')) return id.replace('_wall_sign', '_sign');
  if (id.endsWith('_wall_hanging_sign')) return id.replace('_wall_hanging_sign', '_hanging_sign');
  if (id.endsWith('_wall_banner')) return id.replace('_wall_banner', '_banner');
  return id;
}

function modeToggle() {
  return `<div class="seg mode-toggle">
    ${['SURVIVAL', 'CREATIVE', 'ALL'].map(m => `<button data-mode="${m}" class="${currentMode === m ? 'active ' : ''}${tone(m)}">${m === 'ALL' ? 'All' : m[0] + m.slice(1).toLowerCase()}</button>`).join('')}
  </div>`;
}
function bindMode(callback) {
  document.querySelectorAll('.mode-toggle button').forEach(button => {
    button.onclick = () => {
      currentMode = button.dataset.mode;
      if (callback) callback(); else load();
    };
  });
}

function route() {
  const path = location.pathname;
  if (path === '/server/local/about' || path === '/server/local/about/') {
    return { page: 'about' };
  }
  if (path.startsWith('/server/local/project/')) {
    const slug = decodeURIComponent(path.substring('/server/local/project/'.length));
    return { page: 'project', slug };
  }
  if (path === '/server/local/projects' || path === '/server/local/projects/') {
    return { page: 'projects' };
  }
  if (path.startsWith('/server/local/player/')) {
    const key = decodeURIComponent(path.substring('/server/local/player/'.length));
    return { page: 'player', key };
  }
  if (path.startsWith('/server/local/npcs/player/')) {
    const key = decodeURIComponent(path.substring('/server/local/npcs/player/'.length));
    return { page: 'entityPlayer', key };
  }
  if (path === '/server/local/npcs' || path === '/server/local/npcs/') {
    return { page: 'entityStats' };
  }
  if (path === '/server/local/npc-rankings' || path === '/server/local/npc-rankings/') {
    return { page: 'entityRankings' };
  }
  if (path === '/server/local/npc-index' || path === '/server/local/npc-index/') {
    return { page: 'entityIndex' };
  }
  if (path === '/server/local/blocks' || path === '/server/local/blocks/') {
    return { page: 'blockStats' };
  }
  if (path === '/server/local/block-index' || path === '/server/local/block-index/') {
    return { page: 'blocks' };
  }
  if (path.startsWith('/server/local/movement/player/')) {
    const key = decodeURIComponent(path.substring('/server/local/movement/player/'.length));
    return { page: 'movementPlayer', key };
  }
  if (path === '/server/local/movement' || path === '/server/local/movement/') {
    return { page: 'movement' };
  }
  if (path === '/server/local/movement-rankings' || path === '/server/local/movement-rankings/') {
    return { page: 'movementRankings' };
  }
  if (path.startsWith('/server/local/production/player/')) {
    const key = decodeURIComponent(path.substring('/server/local/production/player/'.length));
    return { page: 'productionPlayer', key };
  }
  if (path === '/server/local/production' || path === '/server/local/production/') {
    return { page: 'production' };
  }
  if (path === '/server/local/production-index' || path === '/server/local/production-index/') {
    return { page: 'productionIndex' };
  }
  if (path === '/server/local/production-rankings' || path === '/server/local/production-rankings/') {
    return { page: 'productionRankings' };
  }
  if (path === '/server/local/worlds' || path === '/server/local/worlds/') {
    return { page: 'worlds' };
  }
  if (path === '/server/local/interactions' || path === '/server/local/interactions/') {
    return { page: 'interactions' };
  }
  if (path.startsWith('/server/local/interactions/player/')) {
    const key = decodeURIComponent(path.substring('/server/local/interactions/player/'.length));
    return { page: 'interactionPlayer', key };
  }
  if (path.startsWith('/server/local/world/')) {
    const name = decodeURIComponent(path.substring('/server/local/world/'.length));
    return { page: 'worldDetail', name };
  }
  if (path.startsWith('/server/local/worlds/')) {
    const name = decodeURIComponent(path.substring('/server/local/worlds/'.length));
    if (name) return { page: 'worldDetail', name };
  }
  return { page: 'server' };
}
function load() {
  const r = route();
  if (r.page === 'about') return loadAbout();
  if (r.page === 'project') return loadProject(r.slug);
  if (r.page === 'projects') return loadProjects();
  if (r.page === 'player') return loadPlayer(r.key);
  if (r.page === 'entityPlayer') return loadEntityPlayer(r.key);
  if (r.page === 'entityStats') return loadEntityStats();
  if (r.page === 'entityRankings') return loadEntityRankings();
  if (r.page === 'entityIndex') return loadEntityIndex();
  if (r.page === 'blockStats') return loadBlockStats();
  if (r.page === 'blocks') return loadBlockIndex();
  if (r.page === 'movementPlayer') return loadMovementPlayer(r.key);
  if (r.page === 'movement') return loadMovementStats();
  if (r.page === 'movementRankings') return loadMovementRankings();
  if (r.page === 'productionPlayer') return loadProductionPlayer(r.key);
  if (r.page === 'production') return loadProductionStats();
  if (r.page === 'productionIndex') return loadProductionIndex();
  if (r.page === 'productionRankings') return loadProductionRankings();
  if (r.page === 'worlds') return loadWorlds();
  if (r.page === 'worldDetail') return loadWorldDetail(r.name);
  if (r.page === 'interactions') return loadInteractionStats();
  if (r.page === 'interactionPlayer') return loadInteractionPlayer(r.key);
  return loadLanding();
}

let moduleStatus = { blocks: true, npc_combat: true, movement: true, production: true, interactions: true, worlds: true };

async function loadLanding() {
  app().innerHTML = '<section class="loading">Loading modules...</section>';
  try {
    const [modStatus] = await Promise.all([
      post('/api/functions/getModuleStatus', {})
    ]);
    if (modStatus && modStatus.success) {
      moduleStatus = modStatus;
    }
    const name = '404Stats Local';
    const [
      survivalRes, creativeRes, allRes,
      combatRes, movementRes, productionRes,
      worldRes, interactionRes
    ] = await Promise.allSettled([
      moduleStatus.blocks ? post('/api/functions/getServerData', { game_mode: 'SURVIVAL' }) : Promise.reject(),
      moduleStatus.blocks ? post('/api/functions/getServerData', { game_mode: 'CREATIVE' }) : Promise.reject(),
      moduleStatus.blocks ? post('/api/functions/getServerData', { game_mode: 'ALL' }) : Promise.reject(),
      moduleStatus.npc_combat ? post('/api/functions/getEntityData', { entity_group: 'ALL' }) : Promise.reject(),
      moduleStatus.movement ? post('/api/functions/getMovementData', { game_mode: 'ALL' }) : Promise.reject(),
      moduleStatus.production ? post('/api/functions/getProductionData', { game_mode: 'ALL', production_type: 'ALL' }) : Promise.reject(),
      moduleStatus.worlds ? post('/api/functions/getWorldList', {}) : Promise.reject(),
      moduleStatus.interactions ? post('/api/functions/getInteractionData', { interaction_group: 'ALL', game_mode: 'ALL' }) : Promise.reject()
    ]);
    const survival = survivalRes.status === 'fulfilled' ? survivalRes.value : null;
    const creative = creativeRes.status === 'fulfilled' ? creativeRes.value : null;
    const all = allRes.status === 'fulfilled' ? allRes.value : null;
    const combat = combatRes.status === 'fulfilled' ? combatRes.value : null;
    const movement = movementRes.status === 'fulfilled' ? movementRes.value : null;
    const production = productionRes.status === 'fulfilled' ? productionRes.value : null;
    const worldData = worldRes.status === 'fulfilled' ? worldRes.value : null;
    const interactionData = interactionRes.status === 'fulfilled' ? interactionRes.value : null;

    const serverName = all?.server?.name || survival?.server?.name || '404Stats Local';
    const combatSummary = combat?.summary || {};
    const moveSummary = movement?.summary || {};
    const prodSummary = production?.summary || {};
    const moveTypes = movement?.type_distribution || [];
    const walkDist = moveTypeDist(moveTypes, ['WALK', 'SPRINT', 'SNEAK']);
    const flyDist = moveTypeDist(moveTypes, ['ELYTRA', 'CREATIVE_FLY']);
    const jumpsVal = moveTypeEvent(moveTypes, 'JUMP');
    const worldDims = worldData?.dimensions || {};
    const interactionSummary = interactionData?.summary || {};
    header(serverName, '/server/local');
    app().innerHTML = `
      <section class="telemetry-hero">
        <div class="hero-icon-wrap"><img src="/server-icon.png" alt="${attr(serverName)} server icon" onerror="this.parentElement.classList.add('fallback')" /></div>
        <div class="hero-content">
          <span class="hero-badge">Multiplayer Statistics</span>
          <h1 class="hero-title">${esc(serverName)}</h1>
          <p class="hero-sub">Select a stats menu for this local Minecraft server.</p>
          <div class="hero-quick-stats">
            ${moduleStatus.blocks ? `<span class="hero-stat"><b>${esc(fmt(survival?.summary?.total || all?.summary?.total || 0))}</b><i>blocks</i></span>` : ''}
            ${moduleStatus.npc_combat ? `<span class="hero-stat"><b>${esc(fmt(combatSummary.kills || 0))}</b><i>kills</i></span>` : ''}
            ${formatModList()}
          </div>
        </div>
      </section>
      ${assetNotice()}
      <section class="module-grid">
        ${moduleStatus.blocks ? cardBlock(survival, creative, all) : ''}
        ${moduleStatus.npc_combat ? cardCombat(combatSummary) : ''}
        ${moduleStatus.movement ? cardMovement(walkDist, flyDist, jumpsVal) : ''}
        ${moduleStatus.production ? cardProduction(prodSummary) : ''}
        ${moduleStatus.interactions ? cardInteractions(interactionSummary) : ''}
        ${moduleStatus.worlds ? cardWorlds(worldDims) : ''}
      </section>`;
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load landing page</h2><p>${esc(e.message)}</p></section>`;
    toast(e.message);
  }
}

function formatModList() {
  const active = [];
  if (moduleStatus.blocks) active.push('Blocks');
  if (moduleStatus.npc_combat) active.push('Combat');
  if (moduleStatus.movement) active.push('Movement');
  if (moduleStatus.production) active.push('Production');
  if (moduleStatus.interactions) active.push('Interact');
  if (moduleStatus.worlds) active.push('Worlds');
  if (active.length === 0) return '<span class="hero-stat"><i>no modules</i></span>';
  if (active.length <= 4) return active.map(m => `<span class="hero-stat"><i>${esc(m)}</i></span>`).join('');
  return `<span class="hero-stat"><i>${active.length} modules active</i></span>`;
}

function cardBlock(survival, creative, all) {
  return `<button class="module-card blocks-module" onclick="goBlocks()">
    <div class="module-top"><span class="module-icon">⛏</span><div><strong>Blocks</strong><small>Mined, placed, players and block index</small></div></div>
    <div class="module-stats three">${blockModeSummary('SURV', survival?.summary)}${blockModeSummary('CREA', creative?.summary)}${blockModeSummary('ALL', all?.summary)}</div>
    <span class="module-action">Open block menu →</span>
  </button>`;
}

function cardCombat(summary) {
  return `<button class="module-card combat-module" onclick="goNpcs()">
    <div class="module-top"><span class="module-icon">⚔</span><div><strong>NPC Combat</strong><small>Kills, deaths, mobs, worlds and weapons</small></div></div>
    <div class="module-stats two"><div><span>KILLS</span><b>${fmt(summary.kills || 0)}</b></div><div><span>DEATHS</span><b>${fmt(summary.deaths || 0)}</b></div></div>
    <span class="module-action">Open combat menu →</span>
  </button>`;
}

function cardMovement(walkDist, flyDist, jumpsVal) {
  return `<button class="module-card movement-module" onclick="goMovement()">
    <div class="module-top"><span class="module-icon">👟</span><div><strong>Movement</strong><small>Walk, fly, ride and jump statistics</small></div></div>
    <div class="module-stats three"><div><span>WALK</span><b>${fmtDistItem(walkDist)}</b></div><div><span>FLY</span><b>${fmtDistItem(flyDist)}</b></div><div><span>JUMPS</span><b>${fmt(jumpsVal)}</b></div></div>
    <span class="module-action">Open movement menu →</span>
  </button>`;
}

function cardProduction(summary) {
  return `<button class="module-card production-module" onclick="goProduction()">
    <div class="module-top"><span class="module-icon">🏭</span><div><strong>Production</strong><small>Crafting, smelting, smithing, stonecutting</small></div></div>
    <div class="module-stats three"><div><span>MADE</span><b>${fmt(summary.total_amount || 0)}</b></div><div><span>ACTIONS</span><b>${fmt(summary.total_actions || 0)}</b></div><div><span>ITEMS</span><b>${fmt(summary.unique_items || 0)}</b></div></div>
    <span class="module-action">Open production menu →</span>
  </button>`;
}

function cardInteractions(summary) {
  return `<button class="module-card interactions-module" onclick="goInteractions()">
    <div class="module-top"><span class="module-icon">🔗</span><div><strong>Interactions</strong><small>Chests, doors, bells, animals, buckets</small></div></div>
    <div class="module-stats three"><div><span>ACTIONS</span><b>${fmt(summary.actions || 0)}</b></div><div><span>TYPES</span><b>${fmt(summary.unique_types || 0)}</b></div><div><span>PLAYERS</span><b>${fmt(summary.players || 0)}</b></div></div>
    <span class="module-action">Open interaction menu →</span>
  </button>`;
}

function cardWorlds(dims) {
  return `<button class="module-card worlds-module" onclick="goWorlds()">
    <div class="module-top"><span class="module-icon">🌍</span><div><strong>Worlds</strong><small>Dimensions and world activity overview</small></div></div>
    <div class="module-stats three"><div><span>OVER</span><b>${fmt(dims.overworld || 0)}</b></div><div><span>NETHER</span><b>${fmt(dims.nether || 0)}</b></div><div><span>END</span><b>${fmt(dims.the_end || 0)}</b></div></div>
    <span class="module-action">Open worlds menu →</span>
  </button>`;
}

function blockModeSummary(label, summary = {}) {
  return `<div><span>${esc(label)}</span><b>${fmt(summary.total || 0)}</b><small>${fmt(summary.mined || 0)} mined / ${fmt(summary.placed || 0)} placed</small></div>`;
}

async function loadBlockStats() {
  app().innerHTML = '<section class="loading">Loading block stats...</section>';
  try {
    const data = await post('/api/functions/getServerData', { game_mode: currentMode });
    const s = data.summary || {};
    header(data.server?.name || '404Stats Local', '/server/local/blocks');
    app().innerHTML = `
      <section class="hero-row"><button class="back-link-button" onclick="goServer()">← Modules</button>${modeToggle()}</section>
      ${assetNotice()}
      ${sharePanel('Server Dashboard', 'Minecraft server stats powered by 404Stats.')}
      <section class="cards">${stat('Blocks mined', s.mined, 'cyan')}${stat('Blocks placed', s.placed, 'pink')}${stat('Total', s.total, 'mixed', `${fmtFull(s.players || 0)} Players`)}</section>
      <section class="two-col"><article class="panel"><h2>🍂 Material Categories</h2><div class="donut-wrap"><div class="donut" id="categoryDonut"></div><div class="legend" id="categoryLegend"></div></div></article><article class="panel"><h2>🌎 World Distribution</h2><div class="donut-wrap"><div class="donut" id="worldDonut"></div><div class="legend" id="worldLegend"></div></div></article></section>
      <section class="panel fun-panel"><h2>🧪 Fun Facts</h2><div class="facts" id="funFacts"></div></section>
      <section class="search-row"><div class="search-wrapper"><input id="playerSearch" autocomplete="off" placeholder="Search players..."/><div class="search-results hidden" id="playerSearchResults"></div></div><button id="playersBtn">Players</button><button id="projectsBtn">Projects</button><button id="blockIndexBtn">Block Index</button><button id="compareBtn">Compare</button></section>
      <section class="panel"><div class="panel-title-row"><h2>↗ Server Trend</h2><div class="mini-legend"><span class="dot cyan-dot"></span>Mined <span class="dot pink-dot"></span>Placed</div></div><div class="chart" id="trendChart"></div></section>
      <section class="panel"><h2>💎 Top 25 Blocks</h2><div class="block-list" id="topBlocks"></div></section>
      <section class="two-col bottom"><article class="panel"><h2>⛏ Top 25 Miners</h2><div class="player-list" id="topMiners"></div></article><article class="panel"><h2>🧱 Top 25 Builders</h2><div class="player-list" id="topBuilders"></div></article></section>`;
    bindMode(loadBlockStats);
    renderDonut('categoryDonut', 'categoryLegend', data.material_categories || [], 'name');
    renderDonut('worldDonut', 'worldLegend', data.world_distribution || [], 'display_name');
    renderFacts(Number(s.total || 0) > 0 ? data.fun_facts || [] : []);
    renderTrend(data.trend || []);
    renderBlocks(data.top_blocks || []);
    renderPlayers('topMiners', data.top_miners || [], 'mined');
    renderPlayers('topBuilders', data.top_builders || [], 'placed');
    bindSearch();
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load block stats</h2><p>${esc(e.message)}</p></section>`;
    toast(e.message);
  }
}

async function loadEntityStats() {
  app().innerHTML = '<section class="loading">Loading NPC Combat stats...</section>';
  try {
    const data = await post('/api/functions/getEntityData', { entity_group: entityGroup, game_mode: currentEntityMode });
    const s = data.summary || {};
    header(data.server?.name || '404Stats Local', '/server/local/npcs');
    app().innerHTML = `
      <section class="hero-row"><button class="back-link-button" onclick="goServer()">← Modules</button><div class="seg-stack">${entityModeToggle(loadEntityStats)}${entityGroupToggle(loadEntityStats)}</div></section>
      ${sharePanel('NPC Combat Dashboard', 'Minecraft mob and NPC combat stats powered by 404Stats.')}
      <section class="cards">${stat('Kills', s.kills, 'cyan')}${stat('Deaths', s.deaths, 'pink')}${stat('Total', s.total, 'mixed', `${fmtFull(s.players || 0)} Players`)}</section>
      <section class="two-col"><article class="panel"><h2>🌎 World Distribution</h2><div class="donut-wrap"><div class="donut" id="entityWorldDonut"></div><div class="legend" id="entityWorldLegend"></div></div></article><article class="panel"><h2>🎮 Game Modes</h2><div class="donut-wrap"><div class="donut" id="entityModeDonut"></div><div class="legend" id="entityModeLegend"></div></div></article></section>
      <section class="search-row npc-search-row"><button class="compact-action" onclick="goEntityIndex()">NPC Index</button><button class="compact-action" onclick="goEntityRankings()">Rankings</button><div class="search-wrapper"><input id="entityPlayerSearch" autocomplete="off" placeholder="Search combat players..."/><div class="search-results hidden" id="entityPlayerSearchResults"></div></div></section>
      <section class="panel"><h2>☠ Top 50 Mobs and NPCs</h2><div class="block-list" id="topEntities"></div></section>
      <section class="two-col bottom"><article class="panel"><h2>🏹 Most Kills</h2><div class="player-list" id="topKillers"></div></article><article class="panel"><h2>💀 Most Deaths</h2><div class="player-list" id="topDeaths"></div></article></section>
      <section class="two-col bottom"><article class="panel"><h2>⚔ Top Player Weapons</h2><div class="entity-list" id="topKillItems"></div></article><article class="panel"><h2>💀 Top Mob Weapons</h2><div class="entity-list" id="topDeathItems"></div></article></section>`;
    renderDonut('entityWorldDonut', 'entityWorldLegend', data.world_distribution || [], 'display_name');
    renderDonut('entityModeDonut', 'entityModeLegend', data.game_mode_distribution || [], 'display_name');
    renderEntities(data.top_entities || []);
    renderEntityPlayers('topKillers', (data.top_killers || data.top_players || []).slice(0, 10), 'kills');
    renderEntityPlayers('topDeaths', (data.top_deaths || []).slice(0, 10), 'deaths');
    renderCombatItems('topKillItems', data.top_kill_items || [], 'No player weapons yet.');
    renderCombatItems('topDeathItems', data.top_death_items || [], 'No mob weapons yet.');
    bindEntityPlayerSearch();
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load NPC Combat</h2><p>${esc(e.message)}</p></section>`;
    toast(e.message);
  }
}

async function loadEntityRankings() {
  app().innerHTML = '<section class="loading">Loading NPC rankings...</section>';
  try {
    const data = await post('/api/functions/getEntityData', { entity_group: entityGroup, game_mode: currentEntityMode });
    const s = data.summary || {};
    header(data.server?.name || '404Stats Local', '/server/local/npc-rankings');
    app().innerHTML = `
      <section class="subpage-head"><div><h2>NPC Combat Rankings</h2><p>${fmtFull(s.players || 0)} players · ${fmt(s.total || 0)} combat actions</p></div><button class="back-link-button" onclick="goNpcs()">← NPC Dashboard</button></section>
      <section class="hero-row"><button class="compact-action" onclick="goEntityIndex()">NPC Index</button><div class="seg-stack">${entityModeToggle(loadEntityRankings)}${entityGroupToggle(loadEntityRankings)}</div></section>
      <section class="two-col bottom"><article class="panel"><div class="panel-title-row"><h2>🏹 Top Kills</h2><span class="muted">Full kill ranking</span></div><div class="player-list" id="rankingKills"></div></article><article class="panel"><div class="panel-title-row"><h2>💀 Top Deaths</h2><span class="muted">Full death ranking</span></div><div class="player-list" id="rankingDeaths"></div></article></section>`;
    renderEntityPlayers('rankingKills', data.top_killers || data.top_players || [], 'kills');
    renderEntityPlayers('rankingDeaths', data.top_deaths || [], 'deaths');
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load NPC Rankings</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goNpcs()">← Back to NPC Combat</button></section>`;
    toast(e.message);
  }
}

async function loadEntityIndex() {
  app().innerHTML = '<section class="loading">Loading NPC index...</section>';
  try {
    const data = await post('/api/functions/getEntityData', { entity_group: entityGroup, game_mode: currentEntityMode });
    const s = data.summary || {};
    header(data.server?.name || '404Stats Local', '/server/local/npc-index');
    app().innerHTML = `
      <section class="subpage-head"><div><h2>NPC Index</h2><p>${fmtFull(s.entity_types || 0)} entity types · ${fmt(s.total || 0)} combat actions</p></div><button class="back-link-button" onclick="goNpcs()">← NPC Dashboard</button></section>
      <section class="hero-row"><div></div><div class="seg-stack">${entityModeToggle(loadEntityIndex)}${entityGroupToggle(loadEntityIndex)}</div></section>
      <section class="panel hall-panel"><div class="panel-title-row"><h2>🏆 Combat Hall of Fame</h2><span class="muted">Most active mobs and NPCs</span></div><div class="hall-grid" id="entityHall"></div></section>
      <section class="block-index-list" id="entityIndexList"></section>`;
    renderEntityHall(data.top_entities || []);
    renderEntityIndexRows(data.top_entities || []);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load NPC Index</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goNpcs()">← Back to NPC Combat</button></section>`;
    toast(e.message);
  }
}

async function loadEntityPlayer(key) {
  app().innerHTML = '<section class="loading">Loading NPC player stats...</section>';
  try {
    const data = await post('/api/functions/getEntityPlayerData', { uuid: key, entity_group: entityGroup, game_mode: currentEntityMode });
    const p = data.player || {}, s = data.summary || {}, name = p.player_name || 'Unknown';
    header(data.server?.name || '404Stats Local', `/server/local/npcs/player/${p.uuid || key}`);
    app().innerHTML = `
      <section class="player-topline"><button class="back-link-button" onclick="goNpcs()">← Back to NPC Combat</button></section>
      <section class="player-hero"><div class="player-title"><div class="big-avatar">${playerHead(p.uuid || key, name, 'big')}</div><div><h2>${esc(name)}</h2><p>NPC Combat · ${fmtFull(s.entity_types || 0)} entity types · ${fmtFull(s.worlds || 0)} worlds</p></div></div><div class="seg-stack">${entityModeToggle(() => loadEntityPlayer(key))}${entityGroupToggle(() => loadEntityPlayer(key))}</div></section>
      <section class="cards">${stat('Kills', s.kills, 'cyan')}${stat('Deaths', s.deaths, 'pink')}${stat('Total', s.total, 'mixed')}</section>
      <section class="two-col"><article class="panel"><h2>🌎 World Distribution</h2><div class="donut-wrap"><div class="donut" id="playerEntityWorldDonut"></div><div class="legend" id="playerEntityWorldLegend"></div></div></article><article class="panel"><h2>🎮 Game Modes</h2><div class="donut-wrap"><div class="donut" id="playerEntityModeDonut"></div><div class="legend" id="playerEntityModeLegend"></div></div></article></section>
      <section class="panel"><h2>☠ Mob Statistics</h2><div class="block-list" id="playerEntities"></div></section>
      <section class="two-col bottom"><article class="panel"><h2>⚔ Top Player Weapons</h2><div class="entity-list" id="playerKillItems"></div></article><article class="panel"><h2>💀 Top Mob Weapons</h2><div class="entity-list" id="playerDeathItems"></div></article></section>`;
    renderDonut('playerEntityWorldDonut', 'playerEntityWorldLegend', data.world_distribution || [], 'display_name');
    renderDonut('playerEntityModeDonut', 'playerEntityModeLegend', data.game_mode_distribution || [], 'display_name');
    renderEntities(data.top_entities || [], 'playerEntities');
    renderCombatItems('playerKillItems', data.top_kill_items || [], 'No player weapons yet.');
    renderCombatItems('playerDeathItems', data.top_death_items || [], 'No mob weapons yet.');
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel"><h2>NPC player stats not found</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goNpcs()">← Back to NPC Combat</button></section>`;
    toast(e.message);
  }
}

async function loadMovementStats() {
  app().innerHTML = '<section class="loading">Loading movement stats...</section>';
  try {
    const data = await post('/api/functions/getMovementData', { game_mode: currentMode });
    const s = data.summary || {};
    header(data.server?.name || '404Stats Local', '/server/local/movement');
    app().innerHTML = `
      <section class="hero-row"><button class="back-link-button" onclick="goServer()">← Modules</button><div class="seg-stack">${unitToggle(loadMovementStats)}${modeToggle()}</div></section>
      ${assetNotice()}
      ${sharePanel('Movement Dashboard', 'Movement stats powered by 404Stats.')}
      <section class="cards">${statRaw('Total Distance', fmtMovementSummaryLabel(s.distance_cm), 'cyan')}${statRaw('Jumps', fmtFull(num(s.event_count)), 'pink')}${statRaw('Players', fmtFull(num(s.players)), 'mixed')}</section>
      <section class="two-col"><article class="panel"><h2>📊 Movement Types</h2><div class="donut-wrap"><div class="donut" id="moveTypeDonut"></div><div class="legend" id="moveTypeLegend"></div></div></article><article class="panel"><h2>🌎 World Distribution</h2><div class="donut-wrap"><div class="donut" id="moveWorldDonut"></div><div class="legend" id="moveWorldLegend"></div></div></article></section>
      <section class="two-col"><article class="panel"><h2>🗺️ Biome Distribution</h2><div class="donut-wrap"><div class="donut" id="moveBiomeDonut"></div><div class="legend" id="moveBiomeLegend"></div></div></article><article class="panel"><h2>🎮 Game Modes</h2><div class="donut-wrap"><div class="donut" id="moveModeDonut"></div><div class="legend" id="moveModeLegend"></div></div></article></section>
      <section class="panel"><h2>🗺️ Biome Collection</h2><p class="muted">Every biome visited by any player, completed like a checklist.</p><div class="biome-grid" id="moveBiomeGrid"></div></section>
      <section class="search-row move-search-row"><div class="search-wrapper"><input id="movePlayerSearch" autocomplete="off" placeholder="Search movement players..."/><div class="search-results hidden" id="movePlayerSearchResults"></div></div><button class="compact-action" onclick="goMovementRankings()">Rankings</button></section>
      <section class="panel"><h2>✨ Top Travelers</h2><div class="entity-list" id="topTravelers"></div></section>
      <section class="panels-grid"><article class="panel"><h2>🪶 Top Pilots (Elytra)</h2><div class="entity-list" id="topPilots"></div></article><article class="panel"><h2>⛵ Top Sailors</h2><div class="entity-list" id="topSailors"></div></article><article class="panel"><h2>🐴 Top Riders</h2><div class="entity-list" id="topRiders"></div></article><article class="panel"><h2>🏊 Top Swimmers</h2><div class="entity-list" id="topSwimmers"></div></article><article class="panel"><h2>🧗 Top Climbers</h2><div class="entity-list" id="topClimbers"></div></article><article class="panel"><h2>🪂 Top Fallers</h2><div class="entity-list" id="topFallers"></div></article></section>`;
    bindMode(loadMovementStats);
    renderMoveDonut('moveTypeDonut', 'moveTypeLegend', data.type_distribution || [], 'display_name');
    renderDonut('moveWorldDonut', 'moveWorldLegend', data.world_distribution || [], 'display_name');
    renderDonut('moveBiomeDonut', 'moveBiomeLegend', top10Others(data.biome_distribution || []), 'display_name');
    renderDonut('moveModeDonut', 'moveModeLegend', data.game_mode_distribution || [], 'display_name');
    renderBiomeGrid('moveBiomeGrid', data.biome_distribution || []);
    renderMovePlayers('topTravelers', (data.top_players || []).slice(0, 15), 'total');
    renderMovePlayers('topPilots', data.top_pilots || [], 'total');
    renderMovePlayers('topSailors', data.top_sailors || [], 'total');
    renderMovePlayers('topRiders', data.top_riders || [], 'total');
    renderMovePlayers('topSwimmers', data.top_swimmers || [], 'total');
    renderMovePlayers('topClimbers', data.top_climbers || [], 'total');
    renderMovePlayers('topFallers', data.top_fallers || [], 'total');
    bindMovePlayerSearch();
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load Movement</h2><p>${esc(e.message)}</p></section>`;
    toast(e.message);
  }
}

async function loadMovementRankings() {
  app().innerHTML = '<section class="loading">Loading movement rankings...</section>';
  try {
    const data = await post('/api/functions/getMovementData', { game_mode: currentMode });
    const s = data.summary || {};
    header(data.server?.name || '404Stats Local', '/server/local/movement-rankings');
    app().innerHTML = `
      <section class="subpage-head"><div><h2>Movement Rankings</h2><p>${fmtFull(num(s.players))} players · ${fmtMovementSummaryLabel(s.distance_cm)} total</p></div><button class="back-link-button" onclick="goMovement()">← Movement</button></section>
      <section class="hero-row"><div class="seg-stack">${unitToggle(loadMovementRankings)}${modeToggle()}</div></section>
      <section class="two-col bottom"><article class="panel"><div class="panel-title-row"><h2>✨ Top Travelers</h2><span class="muted">Full ranking</span></div><div class="player-list" id="rankingTravelers"></div></article><article class="panel"><div class="panel-title-row"><h2>🪶 Top Pilots</h2><span class="muted">Elytra ranking</span></div><div class="player-list" id="rankingPilots"></div></article></section>
      <section class="two-col bottom"><article class="panel"><div class="panel-title-row"><h2>⛵ Top Sailors</h2><span class="muted">Boat ranking</span></div><div class="player-list" id="rankingSailors"></div></article><article class="panel"><div class="panel-title-row"><h2>🐴 Top Riders</h2><span class="muted">Mount ranking</span></div><div class="player-list" id="rankingRiders"></div></article></section>
      <section class="two-col bottom"><article class="panel"><div class="panel-title-row"><h2>🏊 Top Swimmers</h2><span class="muted">Swim ranking</span></div><div class="player-list" id="rankingSwimmers"></div></article><article class="panel"><div class="panel-title-row"><h2>🧗 Top Climbers</h2><span class="muted">Climb ranking</span></div><div class="player-list" id="rankingClimbers"></div></article></section>`;
    bindMode(loadMovementRankings);
    renderMovePlayers('rankingTravelers', data.top_players || [], 'total');
    renderMovePlayers('rankingPilots', data.top_pilots || [], 'total');
    renderMovePlayers('rankingSailors', data.top_sailors || [], 'total');
    renderMovePlayers('rankingRiders', data.top_riders || [], 'total');
    renderMovePlayers('rankingSwimmers', data.top_swimmers || [], 'total');
    renderMovePlayers('rankingClimbers', data.top_climbers || [], 'total');
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load Movement Rankings</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goMovement()">← Back to Movement</button></section>`;
    toast(e.message);
  }
}

async function loadMovementPlayer(key) {
  app().innerHTML = '<section class="loading">Loading movement player stats...</section>';
  try {
    const data = await post('/api/functions/getMovementPlayerData', { uuid: key, game_mode: currentMode });
    const p = data.player || {}, s = data.summary || {}, name = p.player_name || 'Unknown';
    const playerMoveTypes = data.type_distribution || [];
    const playerJumps = moveTypeEvent(playerMoveTypes, 'JUMP');
    const biomesVisited = (data.biome_distribution || []).length;
    header(data.server?.name || '404Stats Local', `/server/local/movement/player/${p.uuid || key}`);
    app().innerHTML = `
      <section class="player-topline"><button class="back-link-button" onclick="goMovement()">← Back to Movement</button></section>
      <section class="player-hero"><div class="player-title"><div class="big-avatar">${playerHead(p.uuid || key, name, 'big')}</div><div><h2>${esc(name)}</h2><p>Movement · ${fmtFull(num(s.movement_types))} movement types · ${fmtFull(num(s.worlds))} worlds</p></div></div><div class="seg-stack">${unitToggle(() => loadMovementPlayer(key))}${modeToggle()}</div></section>
      <section class="cards">${statRaw('Total Distance', fmtMovementSummaryLabel(s.distance_cm), 'cyan')}${statRaw('Jumps', fmtFull(playerJumps), 'pink')}${statRaw('Biomes', fmtFull(biomesVisited), 'mixed')}</section>
      <section class="two-col"><article class="panel"><h2>📊 Movement Types</h2><div class="donut-wrap"><div class="donut" id="playerMoveTypeDonut"></div><div class="legend" id="playerMoveTypeLegend"></div></div></article><article class="panel"><h2>🌎 World Distribution</h2><div class="donut-wrap"><div class="donut" id="playerMoveWorldDonut"></div><div class="legend" id="playerMoveWorldLegend"></div></div></article></section>
      <section class="two-col"><article class="panel"><h2>🗺️ Biome Distribution</h2><div class="donut-wrap"><div class="donut" id="playerBiomeDonut"></div><div class="legend" id="playerBiomeLegend"></div></div></article><article class="panel"><h2>🎮 Game Modes</h2><div class="donut-wrap"><div class="donut" id="playerMoveModeDonut"></div><div class="legend" id="playerMoveModeLegend"></div></div></article></section>
      <section class="panel"><h2>🗺️ Biome Collection</h2><p class="muted">Every biome you visited, completed like a checklist.</p><div class="biome-grid" id="playerBiomeGrid"></div></section>
      <section class="panel"><h2>📈 Movement Type Details</h2><div class="move-type-list" id="playerMoveTypes"></div></section>`;
    bindMode(() => loadMovementPlayer(key));
    renderMoveDonut('playerMoveTypeDonut', 'playerMoveTypeLegend', data.type_distribution || [], 'display_name');
    renderDonut('playerMoveWorldDonut', 'playerMoveWorldLegend', data.world_distribution || [], 'display_name');
    renderDonut('playerBiomeDonut', 'playerBiomeLegend', top10Others(data.biome_distribution || []), 'display_name');
    renderDonut('playerMoveModeDonut', 'playerMoveModeLegend', data.game_mode_distribution || [], 'display_name');
    renderBiomeGrid('playerBiomeGrid', data.biome_distribution || []);
    renderMoveTypes('playerMoveTypes', data.type_distribution || []);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel"><h2>Movement player stats not found</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goMovement()">← Back to Movement</button></section>`;
    toast(e.message);
  }
}

async function loadProductionStats() {
  app().innerHTML = '<section class="loading">Loading production stats...</section>';
  try {
    const data = await post('/api/functions/getProductionData', { game_mode: currentMode, production_type: currentProductionType });
    const s = data.summary || {};
    header(data.server?.name || '404Stats Local', '/server/local/production');
    app().innerHTML = `
      <section class="hero-row"><button class="back-link-button" onclick="goServer()">← Modules</button><div class="seg-stack">${productionTypeToggle(loadProductionStats)}${modeToggle()}</div></section>
      ${assetNotice()}
      ${sharePanel('Production Dashboard', 'Crafting, smelting, smithing and stonecutting stats powered by 404Stats.')}
      <section class="cards">${statRaw('Produced', fmtFull(num(s.total_amount)), 'cyan')}${statRaw('Actions', fmtFull(num(s.total_actions)), 'pink')}${statRaw('Items', fmtFull(num(s.unique_items)), 'mixed', `${fmtFull(num(s.players))} Players`)}</section>
      <section class="two-col"><article class="panel"><h2>📊 Production Types</h2><div class="donut-wrap"><div class="donut" id="prodTypeDonut"></div><div class="legend" id="prodTypeLegend"></div></div></article><article class="panel"><h2>🏭 Stations</h2><div class="donut-wrap"><div class="donut" id="prodStationDonut"></div><div class="legend" id="prodStationLegend"></div></div></article></section>
      <section class="two-col"><article class="panel"><h2>🌎 Worlds</h2><div class="donut-wrap"><div class="donut" id="prodWorldDonut"></div><div class="legend" id="prodWorldLegend"></div></div></article><article class="panel"><h2>🎮 Game Modes</h2><div class="donut-wrap"><div class="donut" id="prodModeDonut"></div><div class="legend" id="prodModeLegend"></div></div></article></section>
      <section class="search-row prod-search-row"><div class="search-wrapper"><input id="prodPlayerSearch" autocomplete="off" placeholder="Search production players..."/><div class="search-results hidden" id="prodPlayerSearchResults"></div></div><div class="seg"><button class="compact-action" onclick="goProductionIndex()">📋 Index</button><button class="compact-action" onclick="goProductionRankings()">🏆 Rankings</button></div></section>
      <section class="panel"><h2>💎 Top Items</h2><div class="block-list" id="topProdItems"></div></section>
      <section class="panel"><h2>👑 Top Producers</h2><div class="player-list" id="topProducers"></div></section>
      <section class="panel"><h2>💡 Fun Facts</h2><div class="facts" id="prodFacts"></div></section>`;
    bindMode(loadProductionStats);
    renderDonut('prodTypeDonut', 'prodTypeLegend', data.type_distribution || [], 'display_name');
    renderDonut('prodStationDonut', 'prodStationLegend', data.station_distribution || [], 'display_name');
    renderDonut('prodWorldDonut', 'prodWorldLegend', data.world_distribution || [], 'display_name');
    renderDonut('prodModeDonut', 'prodModeLegend', data.game_mode_distribution || [], 'display_name');
    renderProdItems('topProdItems', data.top_items || []);
    renderProdPlayers('topProducers', data.top_players || []);
    renderFacts(data.fun_facts || [], 'prodFacts');
    bindProdPlayerSearch();
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load Production</h2><p>${esc(e.message)}</p></section>`;
    toast(e.message);
  }
}

async function loadProductionPlayer(key) {
  app().innerHTML = '<section class="loading">Loading production player stats...</section>';
  try {
    const data = await post('/api/functions/getProductionPlayerData', { uuid: key, game_mode: currentMode, production_type: currentProductionType });
    const p = data.player || {}, s = data.summary || {}, name = p.player_name || 'Unknown';
    header(data.server?.name || '404Stats Local', `/server/local/production/player/${p.uuid || key}`);
    app().innerHTML = `
      <section class="player-topline"><button class="back-link-button" onclick="goProduction()">← Back to Production</button></section>
      <section class="player-hero"><div class="player-title"><div class="big-avatar">${playerHead(p.uuid || key, name, 'big')}</div><div><h2>${esc(name)}</h2><p>Production · ${fmtFull(num(s.unique_items))} unique items · ${fmtFull(num(s.worlds))} worlds</p></div></div><div class="seg-stack">${productionTypeToggle(() => loadProductionPlayer(key))}${modeToggle()}</div></section>
      <section class="cards">${statRaw('Produced', fmtFull(num(s.total_amount)), 'cyan')}${statRaw('Actions', fmtFull(num(s.total_actions)), 'pink')}${statRaw('Items', fmtFull(num(s.unique_items)), 'mixed')}</section>
      <section class="two-col"><article class="panel"><h2>📊 Production Types</h2><div class="donut-wrap"><div class="donut" id="playerProdTypeDonut"></div><div class="legend" id="playerProdTypeLegend"></div></div></article><article class="panel"><h2>🏭 Stations</h2><div class="donut-wrap"><div class="donut" id="playerProdStationDonut"></div><div class="legend" id="playerProdStationLegend"></div></div></article></section>
      <section class="panel"><h2>💎 Top Items</h2><div class="block-list" id="playerProdItems"></div></section>`;
    bindMode(() => loadProductionPlayer(key));
    renderDonut('playerProdTypeDonut', 'playerProdTypeLegend', data.type_distribution || [], 'display_name');
    renderDonut('playerProdStationDonut', 'playerProdStationLegend', data.station_distribution || [], 'display_name');
    renderProdItems('playerProdItems', data.top_items || []);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel"><h2>Production player stats not found</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goProduction()">← Back to Production</button></section>`;
    toast(e.message);
  }
}

async function loadProductionIndex() {
  app().innerHTML = '<section class="loading">Loading production index...</section>';
  try {
    const data = await post('/api/functions/getProductionData', { game_mode: currentMode, production_type: currentProductionType });
    const s = data.summary || {};
    header(data.server?.name || '404Stats Local', '/server/local/production-index');
    app().innerHTML = `
      <section class="subpage-head"><div><h2>Production Index</h2><p>${fmtFull(num(s.unique_items))} unique items · ${fmtFull(num(s.total_amount))} produced</p></div><button class="back-link-button" onclick="goProduction()">← Production</button></section>
      <section class="hero-row"><div></div><div class="seg-stack">${productionTypeToggle(loadProductionIndex)}${modeToggle()}</div></section>
      <section class="panel hall-panel"><div class="panel-title-row"><h2>🏆 Production Hall of Fame</h2><span class="muted">Most produced items</span></div><div class="hall-grid" id="prodHall"></div></section>
      <section class="block-index-list" id="prodIndexList"></section>`;
    bindMode(loadProductionIndex);
    renderProdHall(data.top_items || []);
    renderProdIndexRows(data.top_items || []);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load Production Index</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goProduction()">← Back to Production</button></section>`;
    toast(e.message);
  }
}

async function loadProductionRankings() {
  app().innerHTML = '<section class="loading">Loading production rankings...</section>';
  try {
    const [allData, craftingData, smeltingData, smithingData, stonecuttingData] = await Promise.all([
      post('/api/functions/getProductionData', { game_mode: currentMode, production_type: 'ALL' }),
      post('/api/functions/getProductionData', { game_mode: currentMode, production_type: 'CRAFTING' }),
      post('/api/functions/getProductionData', { game_mode: currentMode, production_type: 'SMELTING' }),
      post('/api/functions/getProductionData', { game_mode: currentMode, production_type: 'SMITHING' }),
      post('/api/functions/getProductionData', { game_mode: currentMode, production_type: 'STONECUTTING' })
    ]);
    header(allData.server?.name || '404Stats Local', '/server/local/production-rankings');
    app().innerHTML = `
      <section class="subpage-head"><div><h2>Production Rankings</h2><p>${fmtFull(num(allData.summary?.players || 0))} players · ${fmtFull(num(allData.summary?.total_amount || 0))} total produced</p></div><button class="back-link-button" onclick="goProduction()">← Production</button></section>
      <section class="hero-row"><div></div><div class="seg-stack">${modeToggle()}</div></section>
      <section class="two-col bottom"><article class="panel"><div class="panel-title-row"><h2>👑 All</h2><span class="muted">Full ranking</span></div><div class="player-list" id="rankingAll"></div></article><article class="panel"><div class="panel-title-row"><h2>🔧 Crafting</h2><span class="muted">Full ranking</span></div><div class="player-list" id="rankingCrafting"></div></article></section>
      <section class="two-col bottom"><article class="panel"><div class="panel-title-row"><h2>🔥 Smelting</h2><span class="muted">Full ranking</span></div><div class="player-list" id="rankingSmelting"></div></article><article class="panel"><div class="panel-title-row"><h2>⚒️ Smithing</h2><span class="muted">Full ranking</span></div><div class="player-list" id="rankingSmithing"></div></article></section>
      <section class="two-col bottom"><article class="panel"><div class="panel-title-row"><h2>🗿 Stonecutting</h2><span class="muted">Full ranking</span></div><div class="player-list" id="rankingStonecutting"></div></article></section>`;
    bindMode(loadProductionRankings);
    renderProdPlayers('rankingAll', allData.top_players || []);
    renderProdPlayers('rankingCrafting', craftingData.top_players || []);
    renderProdPlayers('rankingSmelting', smeltingData.top_players || []);
    renderProdPlayers('rankingSmithing', smithingData.top_players || []);
    renderProdPlayers('rankingStonecutting', stonecuttingData.top_players || []);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load Production Rankings</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goProduction()">← Back to Production</button></section>`;
    toast(e.message);
  }
}

async function loadInteractionStats() {
  app().innerHTML = '<section class="loading">Loading interaction stats...</section>';
  try {
    const data = await post('/api/functions/getInteractionData', { game_mode: currentMode, interaction_group: currentInteractGroup });
    const s = data.summary || {};
    header('Interactions', '/server/local/interactions');
    app().innerHTML = `
      <section class="hero-row"><button class="back-link-button" onclick="goServer()">← Modules</button><div class="seg-stack">${interactGroupToggle(loadInteractionStats)}${modeToggle()}</div></section>
      ${assetNotice()}
      ${sharePanel('Interactions Dashboard', 'Containers, doors, bells, animals and usable blocks stats powered by 404Stats.')}
      <section class="cards">${statRaw('Actions', fmtFull(num(s.actions)), 'cyan')}${statRaw('Types', fmtFull(num(s.unique_types)), 'pink')}${statRaw('Targets', fmtFull(num(s.unique_targets)), 'mixed', `${fmtFull(num(s.players))} Players`)}</section>
      <section class="two-col"><article class="panel"><h2>📦 Groups</h2><div class="donut-wrap"><div class="donut" id="interactGroupDonut"></div><div class="legend" id="interactGroupLegend"></div></div></article><article class="panel"><h2>🔧 Types</h2><div class="donut-wrap"><div class="donut" id="interactTypeDonut"></div><div class="legend" id="interactTypeLegend"></div></div></article></section>
      <section class="two-col"><article class="panel"><h2>🌎 Worlds</h2><div class="donut-wrap"><div class="donut" id="interactWorldDonut"></div><div class="legend" id="interactWorldLegend"></div></div></article><article class="panel"><h2>🎮 Game Modes</h2><div class="donut-wrap"><div class="donut" id="interactModeDonut"></div><div class="legend" id="interactModeLegend"></div></div></article></section>
      <section class="search-row"><div class="search-wrapper"><input id="interactPlayerSearch" autocomplete="off" placeholder="Search interaction players..."/><div class="search-results hidden" id="interactPlayerSearchResults"></div></div></section>
      <section class="panel"><h2>🔗 Top Interactions</h2><div class="block-list" id="topInteractions"></div></section>
      <section class="panel"><h2>👑 Top Players</h2><div class="player-list" id="topInteractPlayers"></div></section>
      <section class="panel"><h2>💡 Fun Facts</h2><div class="facts" id="interactFacts"></div></section>`;
    bindMode(loadInteractionStats);
    renderDonut('interactGroupDonut', 'interactGroupLegend', data.group_distribution || [], 'display_name');
    renderDonut('interactTypeDonut', 'interactTypeLegend', data.type_distribution || [], 'display_name');
    renderDonut('interactWorldDonut', 'interactWorldLegend', data.world_distribution || [], 'display_name');
    renderDonut('interactModeDonut', 'interactModeLegend', data.game_mode_distribution || [], 'display_name');
    renderInteractItems('topInteractions', data.top_interactions || []);
    renderInteractPlayers('topInteractPlayers', data.top_players || []);
    renderFacts(data.fun_facts || [], 'interactFacts');
    bindInteractPlayerSearch();
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load Interactions</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goServer()">← Back to Modules</button></section>`;
    toast(e.message);
  }
}

async function loadInteractionPlayer(key) {
  app().innerHTML = '<section class="loading">Loading interaction player stats...</section>';
  try {
    const data = await post('/api/functions/getInteractionPlayerData', { uuid: key, game_mode: currentMode, interaction_group: currentInteractGroup });
    const p = data.player || {}, s = data.summary || {}, name = p.player_name || 'Unknown';
    header(name, `/server/local/interactions/player/${p.uuid || key}`);
    app().innerHTML = `
      <section class="player-topline"><button class="back-link-button" onclick="goInteractions()">← Back to Interactions</button></section>
      <section class="player-hero"><div class="player-title"><div class="big-avatar">${playerHead(p.uuid || key, name, 'big')}</div><div><h2>${esc(name)}</h2><p>Interactions · ${fmtFull(num(s.unique_types))} types · ${fmtFull(num(s.worlds))} worlds</p></div></div><div class="seg-stack">${interactGroupToggle(() => loadInteractionPlayer(key))}${modeToggle()}</div></section>
      <section class="cards">${statRaw('Actions', fmtFull(num(s.actions)), 'cyan')}${statRaw('Types', fmtFull(num(s.unique_types)), 'pink')}${statRaw('Targets', fmtFull(num(s.unique_targets)), 'mixed')}</section>
      <section class="two-col"><article class="panel"><h2>📦 Groups</h2><div class="donut-wrap"><div class="donut" id="pInteractGroupDonut"></div><div class="legend" id="pInteractGroupLegend"></div></div></article><article class="panel"><h2>🔧 Types</h2><div class="donut-wrap"><div class="donut" id="pInteractTypeDonut"></div><div class="legend" id="pInteractTypeLegend"></div></div></article></section>
      <section class="two-col"><article class="panel"><h2>🌎 Worlds</h2><div class="donut-wrap"><div class="donut" id="pInteractWorldDonut"></div><div class="legend" id="pInteractWorldLegend"></div></div></article><article class="panel"><h2>🎮 Game Modes</h2><div class="donut-wrap"><div class="donut" id="pInteractModeDonut"></div><div class="legend" id="pInteractModeLegend"></div></div></article></section>
      <section class="panel"><h2>🔗 Top Interactions</h2><div class="block-list" id="pInteractItems"></div></section>`;
    bindMode(() => loadInteractionPlayer(key));
    renderDonut('pInteractGroupDonut', 'pInteractGroupLegend', data.group_distribution || [], 'display_name');
    renderDonut('pInteractTypeDonut', 'pInteractTypeLegend', data.type_distribution || [], 'display_name');
    renderDonut('pInteractWorldDonut', 'pInteractWorldLegend', data.world_distribution || [], 'display_name');
    renderDonut('pInteractModeDonut', 'pInteractModeLegend', data.game_mode_distribution || [], 'display_name');
    renderInteractItems('pInteractItems', data.top_interactions || []);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Player not found</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goInteractions()">← Back to Interactions</button></section>`;
    toast(e.message);
  }
}

function interactGroupToggle(reload) {
  const groups = [['ALL','All'],['CONTAINER','Containers'],['UTILITY_BLOCK','Utility'],['DOORS_AND_SWITCHES','Doors & Switches'],['SPECIAL_BLOCK','Special'],['ANIMAL','Animals'],['ENTITY','Entities'],['BUCKET','Buckets']];
  setTimeout(() => bindInteractGroup(reload), 0);
  return `<div class="seg entity-toggle">${groups.map(([v,l]) => `<button data-igroup="${v}" class="${currentInteractGroup === v ? 'active' : ''}">${l}</button>`).join('')}</div>`;
}

function bindInteractGroup(reload) {
  document.querySelectorAll('.entity-toggle button').forEach(b => {
    b.onclick = () => { currentInteractGroup = b.dataset.igroup; if (reload) reload(); };
  });
}

function renderInteractItems(id, items) {
  const el = $(id); if (!el) return;
  if (!items.length) { el.innerHTML = '<div class="empty">No interactions yet.</div>'; return; }
  const max = Math.max(1, ...items.map(i => i.total || 0));
  el.innerHTML = items.map(i => `<div class="block-row"><div class="block-name">${interactIcon(i)}<span>${esc(i.display_name || i.target_type || i.entity_type || i.interaction_type)}</span></div><div class="bar"><div class="bar-mined" style="width:${Math.max(4, ((i.total || 0) / max) * 100)}%"></div></div><div class="numbers"><span class="m">${fmtFull(i.total || 0)}</span> <span>/</span> <span class="p">${fmtFull(i.players || 0)} players</span></div></div>`).join('');
}

function interactIcon(i) {
  const entityType = i.entity_type || '';
  const targetMaterial = i.target_material || '';
  if (entityType && assetStatus.iconMode !== 'emoji') return entityIcon(entityType, 'MOB');
  if (entityType) return `<span class="block-icon emoji">${entityEmoji(entityType, 'MOB')}</span>`;
  if (targetMaterial) return blockIcon(targetMaterial);
  return `<span class="block-icon emoji">${interactEmoji(i.interaction_group)}</span>`;
}

function renderInteractPlayers(id, players) {
  const el = $(id); if (!el) return;
  if (!players.length) { el.innerHTML = '<div class="empty">No players yet.</div>'; return; }
  el.innerHTML = players.map(p => `<button class="player-row clickable" data-uuid="${esc(p.uuid)}"><div class="avatar">${playerHead(p.uuid, p.player_name || 'Unknown')}</div><div><div class="player-name">${esc(p.player_name || 'Unknown')}</div><div class="player-total">${fmtFull(p.total || 0)} actions · ${fmtFull(p.types || 0)} types</div></div><strong class="m">${fmt(p.total || 0)}</strong></button>`).join('');
  el.querySelectorAll('.player-row').forEach(r => r.onclick = () => goInteractionPlayer(r.dataset.uuid));
}

function interactEmoji(group) {
  switch ((group || '').toUpperCase()) {
    case 'CONTAINER': return '📦';
    case 'UTILITY_BLOCK': return '🔧';
    case 'DOORS_AND_SWITCHES': return '🚪';
    case 'SPECIAL_BLOCK': return '🔔';
    case 'ANIMAL': return '🐑';
    case 'ENTITY': return '👤';
    case 'BUCKET': return '🪣';
    default: return '🔗';
  }
}

function bindInteractPlayerSearch() {
  const input = $('interactPlayerSearch'), results = $('interactPlayerSearchResults');
  if (!input || !results) return;
  const run = async () => {
    try {
      const j = await post('/api/functions/searchInteractionPlayers', { game_mode: currentMode, interaction_group: currentInteractGroup, query: input.value.trim() });
      const players = j.players || [];
      results.innerHTML = players.length ? players.map(p => `<button class="search-result" data-uuid="${esc(p.uuid)}"><span class="avatar mini">${playerHead(p.uuid, p.player_name || 'Unknown')}</span><span><strong>${esc(p.player_name || 'Unknown')}</strong><small>${fmtFull(p.actions || 0)} actions</small></span><b>${fmt(p.actions || 0)}</b></button>`).join('') : '<div class="search-empty">No interaction players found.</div>';
      results.classList.remove('hidden');
      results.querySelectorAll('.search-result').forEach(b => b.onclick = () => goInteractionPlayer(b.dataset.uuid));
    } catch (e) { results.classList.add('hidden'); }
  };
  input.onfocus = run;
  input.oninput = () => { clearTimeout(interactSearchTimer); interactSearchTimer = setTimeout(run, 120); };
}

async function loadWorlds() {
  app().innerHTML = '<section class="loading">Loading worlds...</section>';
  try {
    const data = await post('/api/functions/getWorldList', {});
    const worlds = data.worlds || [];
    const dims = data.dimensions || {};
    header('Worlds', '/server/local/worlds');
    app().innerHTML = `
      <section class="subpage-head"><div><h2>Worlds</h2><p>${worlds.length} world${worlds.length !== 1 ? 's' : ''} · Overworld ${dims.overworld || 0} · Nether ${dims.nether || 0} · The End ${dims.the_end || 0}</p></div><button class="back-link-button" onclick="goServer()">← Server</button></section>
      ${assetNotice()}
      <section class="worlds-grid" id="worldsGrid"></section>
      <button class="project-back-server" onclick="goServer()">← Back to server</button>`;
    renderWorldCards(worlds);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load worlds</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goServer()">← Back to server</button></section>`;
    toast(e.message);
  }
}

async function loadWorldDetail(worldName) {
  app().innerHTML = '<section class="loading">Loading world...</section>';
  try {
    const data = await post('/api/functions/getWorldData', { world_name: worldName });
    const s = data.summary || {};
    const env = data.environment || 'NORMAL';
    const envEmoji = env === 'NETHER' ? '🔥' : env === 'THE_END' ? '🌑' : '🌍';
    const envLabel = env === 'NETHER' ? 'Nether' : env === 'THE_END' ? 'The End' : 'Overworld';
    const firstSeen = data.first_seen ? new Date(data.first_seen).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown';
    header(data.display_name || worldName, '/server/local/world/' + encodeURIComponent(worldName));

    app().innerHTML = `
      <section class="world-detail-head">
        <button class="back-link-button" onclick="goWorlds()">← Back to Worlds</button>
        <div class="world-detail-hero">
          <div class="world-detail-icon">${envEmoji}</div>
          <div>
            <h2>${esc(data.display_name || worldName)}</h2>
            <p>${esc(envLabel)}${data.world_type ? ' · ' + esc(data.world_type.replace(/_/g, ' ')) : ''} · <span class="world-raw-name-inline">${esc(worldName)}</span></p>
          </div>
        </div>
        <div class="world-detail-meta">Discovered ${firstSeen} · ${fmtFull(num(s.total_players || 0))} players</div>
      </section>
      ${assetNotice()}
      <section class="cards">
        <article class="stat-card cyan"><span>⛏ Blocks</span><strong>${fmtFull(num(s.blocks_total || 0))}</strong><small>${fmtFull(num(s.mined || 0))} mined · ${fmtFull(num(s.placed || 0))} placed</small></article>
        <article class="stat-card pink"><span>⚔ Combat</span><strong>${fmtFull(num(s.combat_total || 0))}</strong><small>${fmtFull(num(s.kills || 0))} kills · ${fmtFull(num(s.deaths || 0))} deaths</small></article>
        <article class="stat-card mixed"><span>👟 Movement</span><strong>${fmtDistFull(num(s.distance_cm || 0))}</strong><small>${fmtFull(num(s.move_players || 0))} players</small></article>
      </section>
      <section class="two-col">
        <article class="panel"><h2>🍂 Material Categories</h2><div class="donut-wrap"><div class="donut" id="worldCatDonut"></div><div class="legend" id="worldCatLegend"></div></div></article>
        <article class="panel"><h2>👟 Movement Types</h2><div class="donut-wrap"><div class="donut" id="worldMoveDonut"></div><div class="legend" id="worldMoveLegend"></div></div></article>
      </section>
      <section class="panel"><div class="panel-title-row"><h2>💎 Top Blocks</h2><div class="mini-legend"><span class="dot cyan-dot"></span>Mined <span class="dot pink-dot"></span>Placed</div></div><div class="block-list" id="worldTopBlocks"></div></section>
      <section class="panel"><div class="panel-title-row"><h2>☠️ Top Entities</h2><div class="mini-legend"><span class="dot cyan-dot"></span>Kills <span class="dot pink-dot"></span>Deaths</div></div><div class="block-list" id="worldTopEntities"></div></section>
      <section class="two-col">
        <article class="panel"><h2>⛏ Top Miners</h2><div class="player-list" id="worldTopMiners"></div></article>
        <article class="panel"><h2>🏗 Top Builders</h2><div class="player-list" id="worldTopBuilders"></div></article>
      </section>
      <section class="two-col">
        <article class="panel"><h2>⚔ Top Killers</h2><div class="player-list" id="worldTopKillers"></div></article>
        <article class="panel"><h2>👟 Top Travelers</h2><div class="player-list" id="worldTopTravelers"></div></article>
      </section>
      <section class="two-col">
        <article class="panel"><h2>🏭 Top Producers</h2><div class="player-list" id="worldTopProducers"></div></article>
      </section>
      <button class="project-back-server" onclick="goWorlds()">← Back to Worlds</button>`;

    renderDonut('worldCatDonut', 'worldCatLegend', data.material_categories || [], 'name');
    renderDonut('worldMoveDonut', 'worldMoveLegend', data.movement_types || [], 'movement_type');

    renderWorldTopBlocks(data.top_blocks || []);
    renderWorldTopEntities(data.top_entities || []);
    renderWorldPlayers('worldTopMiners', data.top_miners || [], 'mined');
    renderWorldPlayers('worldTopBuilders', data.top_builders || [], 'placed');
    renderWorldPlayers('worldTopKillers', data.top_killers || [], 'kills');
    renderWorldPlayers('worldTopTravelers', data.top_travelers || [], 'distance');
    renderProducersForWorld(data.top_producers || []);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>World not found</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goWorlds()">← Back to Worlds</button></section>`;
    toast(e.message);
  }
}

function renderWorldTopBlocks(blocks) {
  const el = document.getElementById('worldTopBlocks');
  if (!el) return;
  if (!blocks.length) { el.innerHTML = '<div class="empty">No blocks yet.</div>'; return; }
  const max = Math.max(1, ...blocks.map(b => b.total || 0));
  el.innerHTML = blocks.map(b => `<div class="block-row"><div class="block-name">${blockIcon(b.material)}<span>${esc(b.display_name || b.material)}</span></div><div class="bar"><div class="bar-mined" style="width:${((b.mined || 0) / max) * 100}%"></div><div class="bar-placed" style="width:${((b.placed || 0) / max) * 100}%"></div></div><div class="numbers"><span class="m">${fmtFull(b.mined)}</span><span>/</span><span class="p">${fmtFull(b.placed)}</span><strong>${fmtFull(b.total)}</strong></div></div>`).join('');
}

function renderWorldTopEntities(entities) {
  const el = document.getElementById('worldTopEntities');
  if (!el) return;
  if (!entities.length) { el.innerHTML = '<div class="empty">No combat data yet.</div>'; return; }
  const max = Math.max(1, ...entities.map(e => e.total || 0));
  el.innerHTML = entities.map(e => `<div class="block-row"><div class="block-name">${entityIcon(e.entity_type, e.entity_group)}<span>${esc(e.display_name || fmtType(e.entity_type))}</span></div><div class="bar"><div class="bar-mined" style="width:${((e.kills || 0) / max) * 100}%"></div><div class="bar-placed" style="width:${((e.deaths || 0) / max) * 100}%"></div></div><div class="numbers"><span class="m">${fmtFull(e.kills)}</span><span>/</span><span class="p">${fmtFull(e.deaths)}</span><strong>${fmtFull(e.total)}</strong></div></div>`).join('');
}

function fmtType(type) {
  return String(type || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function renderWorldPlayers(id, players, unit) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!players.length) { el.innerHTML = '<div class="empty">No players yet.</div>'; return; }
  el.innerHTML = players.map(p => {
    const val = unit === 'distance' ? fmtDistFull(p.value || 0) : fmtFull(p.value || 0);
    const label = unit === 'mined' ? 'mined' : unit === 'placed' ? 'placed' : unit === 'kills' ? 'kills' : unit === 'distance' ? 'traveled' : '';
    return `<button class="player-row clickable" data-uuid="${esc(p.uuid)}"><div class="avatar">${playerHead(p.uuid, p.player_name || 'Unknown')}</div><div><div class="player-name">${esc(p.player_name || 'Unknown')}</div><div class="player-total">${val} ${label}</div></div><strong>#${p.rank || '?'}</strong></button>`;
  }).join('');
  el.querySelectorAll('.player-row').forEach(r => r.onclick = () => goPlayer(r.dataset.uuid));
}

function renderProducersForWorld(players) {
  const el = document.getElementById('worldTopProducers');
  if (!el) return;
  if (!players.length) { el.innerHTML = '<div class="empty">No production data yet.</div>'; return; }
  el.innerHTML = players.map(p => `<div class="player-row"><div class="avatar">${playerHead(p.uuid, p.player_name)}</div><div class="player-name">${esc(p.player_name)}</div><div class="player-total">${fmtFull(p.value)} items</div></div>`).join('');
}

function renderWorldCards(worlds) {
  const el = document.getElementById('worldsGrid');
  if (!el) return;
  if (!worlds.length) { el.innerHTML = '<section class="panel empty">No worlds found.</section>'; return; }
  el.innerHTML = worlds.map(w => {
    const s = w.stats || {}, b = s.blocks || {}, c = s.combat || {}, m = s.movement || {}, p = s.production || {};
    const env = w.environment || 'NORMAL';
    const envEmoji = env === 'NETHER' ? '🔥' : env === 'THE_END' ? '🌑' : '🌍';
    const envLabel = env === 'NETHER' ? 'Nether' : env === 'THE_END' ? 'The End' : 'Overworld';
    const totalPlayers = Math.max(b.players || 0, c.players || 0, m.players || 0, p.players || 0);
    const totalActions = (b.total || 0) + (c.total || 0) + (p.actions || 0);
    const firstSeen = w.first_seen ? new Date(w.first_seen).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown';
    return `<article class="world-card clickable" onclick="goWorldDetail('${attr(w.world_name)}')">
      <div class="world-card-header">
        <div class="world-env-icon">${envEmoji}</div>
        <div>
          <strong>${esc(w.display_name || w.world_name)}</strong>
          <small>${esc(envLabel)}${w.world_type ? ' · ' + esc(w.world_type.replace(/_/g, ' ')) : ''}</small>
        </div>
      </div>
      <div class="world-stats-grid">
        <div class="world-stat">
          <span class="world-stat-label">⛏ Mined / Placed</span>
          <b>${fmtFull(b.mined || 0)}</b>
          <span class="world-stat-secondary">${fmtFull(b.placed || 0)}</span>
        </div>
        <div class="world-stat">
          <span class="world-stat-label">⚔ Kills / Deaths</span>
          <b>${fmtFull(c.kills || 0)}</b>
          <span class="world-stat-secondary">${fmtFull(c.deaths || 0)}</span>
        </div>
        <div class="world-stat">
          <span class="world-stat-label">👟 Distance</span>
          <b>${fmtDistFull(m.distance_cm || 0)}</b>
        </div>
        <div class="world-stat">
          <span class="world-stat-label">🏭 Produced</span>
          <b>${fmtFull(p.amount || 0)}</b>
          <span class="world-stat-secondary">${fmtFull(p.actions || 0)} actions</span>
        </div>
      </div>
      <div class="world-card-footer">
        <span>${fmtFull(totalPlayers)} player${totalPlayers !== 1 ? 's' : ''} · since ${firstSeen}</span>
        <span>${fmtFull(totalActions)} total actions</span>
      </div>
    </article>`;
  }).join('');
}

function productionTypeToggle(reload) {
  const types = [['ALL', 'All'], ['CRAFTING', 'Crafting'], ['SMELTING', 'Smelting'], ['SMITHING', 'Smithing'], ['STONECUTTING', 'Stonecutting']];
  setTimeout(() => bindProductionType(reload), 0);
  return `<div class="seg entity-toggle">${types.map(([value, label]) => `<button data-ptype="${value}" class="${currentProductionType === value ? 'active' : ''}">${label}</button>`).join('')}</div>`;
}

function bindProductionType(reload) {
  document.querySelectorAll('.entity-toggle button').forEach(button => {
    button.onclick = () => { currentProductionType = button.dataset.ptype; if (reload) reload(); };
  });
}

function loadAbout() {
  header('404Stats Local', '/server/local/about');
  app().innerHTML = `
    ${assetNotice()}
    <section class="about-hero panel">
      <div class="about-logo"><img src="/logo-404.svg" alt="404Stats logo" /></div>
      <div><span class="login-kicker">404Stats v${APP_VERSION}</span><h2>Local Minecraft statistics for blocks, combat, movement, production, interactions and worlds.</h2><p>404Stats is a non-profit plugin built for server owners who want useful statistics without external dashboards or browser hotlinks.</p><div class="about-chip-row"><span>Local H2 storage</span><span>Internal web panel</span><span>Privacy friendly assets</span><span>Alpha — bugs possible</span></div></div>
    </section>
    <section class="about-feature-grid">
      <article class="panel"><h2>Modules</h2><p>The server landing page groups stats into modules. Blocks, NPC Combat and Movement each have dedicated dashboards, rankings and player views.</p></article>
      <article class="panel"><h2>Movement Tracking</h2><p>Tracks walking, sprinting, swimming, flying, riding, boating, climbing, falling, jumping and teleport distances through vanilla Minecraft statistics, including which biomes you visited.</p></article>
      <article class="panel"><h2>Local First</h2><p>Statistics stay in the server's local H2 database. The web panel is served by the plugin and can be password protected before public exposure.</p></article>
    </section>
    <section class="two-col about-grid">
      <article class="panel"><h2>Creator</h2><p>Created by <strong>404DiscNotFound</strong>.</p><div class="brand-links"><a href="https://github.com/404DiscNotFound" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://mcstats.404gnf.de" target="_blank" rel="noopener noreferrer">Project Website</a></div></article>
      <article class="panel"><h2>Community</h2><p>This plugin was made under the <strong>404GameNotFound Community</strong>, a German Gaming Community.</p><div class="brand-links"><a href="https://404gnf.de" target="_blank" rel="noopener noreferrer">404GNF Website</a><a href="https://discord.gg/gsQEWZScuX" target="_blank" rel="noopener noreferrer">Discord</a></div></article>
    </section>
    <section class="panel"><h2>Privacy Friendly</h2><div class="privacy-list"><div>No tracking widgets in the web panel.</div><div>No browser hotlinks for player heads or block icons.</div><div>Minecraft texture assets are opt-in only.</div><div>External services only open after you click a link.</div><div>Only password-protected local panels use a session cookie for authentication.</div><div>404Stats uses bStats for anonymous plugin metrics.</div></div></section>
    <section class="panel tech-info-panel"><h2>Technical Privacy Info</h2><details class="tech-info"><summary><span>Cookies, device storage and exchanged data</span><b>Open details</b></summary><div class="tech-info-grid"><article><h3>Cookies</h3><p>404Stats sets no tracking cookies. If <code>webpanel.password</code> is configured and you log in, the webserver sets one authentication cookie named <code>f0fstats_local_session</code>.</p><p>The session cookie is <code>HttpOnly</code>, uses <code>SameSite=Lax</code>, is valid for 24 hours and is only used to unlock this local panel.</p></article><article><h3>Stored on this device</h3><p>The panel does not use <code>localStorage</code>, <code>sessionStorage</code> or IndexedDB. Your browser may cache static files, server icons, player head images and web assets like any normal website.</p></article><article><h3>Data exchanged</h3><p>The browser sends local API requests to this 404Stats webserver to load dashboard data, search results, project data, NPC Combat data and authentication status.</p><p>Player heads and Minecraft icons are served by this plugin. The server may fetch and cache player head textures from Mojang services; Minecraft texture icons are downloaded only when explicitly enabled in <code>config.yml</code>.</p></article><article><h3>Server-side data</h3><p>Statistics are stored in the server's local H2 database. Cached web assets are stored under <code>plugins/404Stats/web-cache/</code>.</p><p>External websites are contacted by your browser only after you click an external link. bStats metrics are sent by the plugin server-side and are not web-panel tracking.</p></article></div></details></section>
    <section class="panel"><h2>Share 404Stats</h2>${sharePanel('404Stats', 'A local-first Minecraft statistics plugin.', true)}</section>
    <button class="project-back-server" onclick="goServer()">← Back to server</button>`;
}

async function loadProjects() {
  app().innerHTML = '<section class="loading">Loading projects...</section>';
  try {
    const data = await post('/api/functions/getProjects', { game_mode: currentMode });
    header(data.server?.name || '404Stats Local', '/server/local/projects');
    app().innerHTML = `
      <section class="projects-head"><div class="projects-title"><span class="projects-folder">▱</span><div><h2>Projects</h2><p>Community builds tracked through Project Mode</p></div></div>${modeToggle()}</section>
      ${assetNotice()}
      <section class="projects-grid" id="projectsGrid"></section>
      <button class="project-back-server" onclick="goServer()">← Back to server</button>`;
    bindMode(loadProjects);
    renderProjectCards(data.projects || []);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load projects</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goServer()">← Back to server</button></section>`;
    toast(e.message);
  }
}

async function loadProject(slug) {
  app().innerHTML = '<section class="loading">Loading project...</section>';
  try {
    const data = await post('/api/functions/getProjectData', { project_slug: slug, game_mode: currentMode, time_range: currentProjectRange });
    const p = data.project || {}, s = data.summary || {}, contributor = data.top_contributor || {}, topBlock = data.top_block || {};
    header(data.server?.name || '404Stats Local', `/server/local/project/${p.project_slug || slug}`);
    app().innerHTML = `
      <section class="project-detail-head"><button class="back-link-button" onclick="goProjects()">← Back to Projects</button><div class="project-detail-title"><span class="project-emoji">🏗️</span><h2>${esc(p.project_name || slug)}</h2></div></section>
      <section class="project-controls"><div>${modeToggle()}</div>${projectRangeToggle()}</section>
      ${assetNotice()}
      ${sharePanel(p.project_name || '404Stats Project', 'Minecraft project stats powered by 404Stats.')}
      <section class="cards project-summary-cards">${stat('Total Blocks', s.total, 'cyan')}${stat('Net Build Gain', s.net_build_gain, 'pink')}${stat('Members', s.members, 'cyan')}</section>
      <section class="two-col project-highlights"><article class="panel highlight-card cyan"><h2>♛ Top Contributor</h2>${contributor.player_name ? `<div class="highlight-main"><span class="avatar">${playerHead(contributor.uuid, contributor.player_name)}</span><div><strong>${esc(contributor.player_name)}</strong><p>${fmtFull(contributor.total || 0)} Total</p></div></div>` : '<div class="empty">No contributor yet.</div>'}</article><article class="panel highlight-card pink"><h2>💎 Top Block</h2>${topBlock.material ? `<div class="highlight-main"><span>${blockIcon(topBlock.material)}</span><div><strong>${esc(topBlock.display_name || topBlock.material)}</strong><p>${fmtFull(topBlock.total || 0)} Total</p></div></div>` : '<div class="empty">No block yet.</div>'}</article></section>
      <section class="two-col"><article class="panel"><h2>🍂 Material Categories</h2><div class="donut-wrap"><div class="donut" id="categoryDonut"></div><div class="legend" id="categoryLegend"></div></div></article><article class="panel"><h2>🌎 World Distribution</h2><div class="donut-wrap"><div class="donut" id="worldDonut"></div><div class="legend" id="worldLegend"></div></div></article></section>
      <section class="panel fun-panel"><h2>✦ Fun Facts</h2><div class="facts" id="funFacts"></div></section>
      <section class="panel"><div class="panel-title-row"><h2>💎 Top Blocks</h2><div class="mini-legend"><span class="dot cyan-dot"></span>Mined <span class="dot pink-dot"></span>Placed</div></div><div class="block-list" id="topBlocks"></div></section>
      <section class="panel"><h2>👥 Contributors</h2><div class="project-contributors" id="projectContributors"></div></section>
      <section class="panel"><div class="panel-title-row"><h2>↗ Activity Timeline</h2><div class="mini-legend"><span class="dot cyan-dot"></span>Mined <span class="dot pink-dot"></span>Placed</div></div><div class="chart" id="trendChart"></div></section>
      <section class="panel"><h2>🏆 Achievements</h2><div class="achievement-grid" id="achievementGrid"></div></section>
      <section class="project-footer-row"><button class="back-link-button" onclick="goProjects()">← Back to Projects</button><span>◷ Last Activity: ${esc(p.last_activity_label || 'No activity')}</span></section>`;
    bindMode(() => loadProject(slug));
    bindProjectRange(slug);
    renderDonut('categoryDonut', 'categoryLegend', data.material_categories || [], 'name');
    renderDonut('worldDonut', 'worldLegend', data.world_distribution || [], 'display_name');
    renderFacts(data.fun_facts || []);
    renderBlocks(data.top_blocks || []);
    renderProjectContributors(data.contributors || []);
    renderTrend(data.trend || []);
    renderAchievements(data.achievements || []);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Project not found</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goProjects()">← Back to Projects</button></section>`;
    toast(e.message);
  }
}

async function loadPlayer(key) {
  app().innerHTML = '<section class="loading">Loading player stats...</section>';
  try {
    const data = await post('/api/functions/getPlayerData', { uuid: key, game_mode: currentMode });
    const p = data.player || {}, s = data.summary || {}, r = data.rankings || {}, name = p.player_name || 'Unknown';
    header(data.server?.name || '404Stats Local', `/server/local/player/${p.uuid || name}`);
    app().innerHTML = `
      <section class="player-topline"><button class="back-link-button" onclick="goServer()">← Back to server</button></section>
      <section class="player-hero"><div class="player-title"><div class="big-avatar">${playerHead(p.uuid || key, name, 'big')}</div><div><h2>${esc(name)}</h2><p>Rank <strong class="cyan-text">#${r.total_rank || p.rank || 0}</strong> / ${fmtFull(r.total_players || p.total_players || 0)} players</p></div></div>${modeToggle()}</section>
      ${assetNotice()}
      <section class="cards">${stat('Blocks mined', s.mined, 'cyan')}${stat('Blocks placed', s.placed, 'pink')}${stat('Total', s.total, 'mixed')}</section>
      <section class="rank-cards">${rankCard('Mined', r.mined_rank, r.total_players, s.mined, 'cyan')}${rankCard('Placed', r.placed_rank, r.total_players, s.placed, 'pink')}${rankCard('Total', r.total_rank, r.total_players, s.total, 'mixed')}</section>
      <section class="two-col"><article class="panel"><h2>🍂 Material Categories</h2><div class="donut-wrap"><div class="donut" id="categoryDonut"></div><div class="legend" id="categoryLegend"></div></div></article><article class="panel"><h2>🌎 World Distribution</h2><div class="donut-wrap"><div class="donut" id="worldDonut"></div><div class="legend" id="worldLegend"></div></div></article></section>
      <section class="panel fun-panel"><h2>🧪 Fun Facts</h2><div class="facts" id="funFacts"></div></section>
      <section class="panel"><div class="panel-title-row"><h2>⚡ Top Blocks</h2><div class="mini-legend"><span class="dot cyan-dot"></span>Mined <span class="dot pink-dot"></span>Placed</div></div><div class="block-list" id="topBlocks"></div></section>`;
    bindMode(() => loadPlayer(key));
    renderDonut('categoryDonut', 'categoryLegend', data.material_categories || [], 'name');
    renderDonut('worldDonut', 'worldLegend', data.world_distribution || [], 'display_name');
    renderFacts(data.fun_facts || []);
    renderBlocks(data.top_blocks || []);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel"><h2>Player not found</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goServer()">← Back to server</button></section>`;
    toast(e.message);
  }
}

async function loadBlockIndex() {
  app().innerHTML = '<section class="loading">Loading block index...</section>';
  try {
    const data = await post('/api/functions/getBlockIndex', { game_mode: currentMode, filter: blockFilter, query: '' });
    const s = data.summary || {};
    header(data.server?.name || '404Stats Local', '/server/local/blocks');
    app().innerHTML = `
      <section class="subpage-head"><div><h2>Block Index</h2><p>${fmtFull(s.unique_blocks || 0)} unique blocks · ${fmt(s.total || 0)} total actions</p></div><button class="back-link-button" onclick="goServer()">← Dashboard</button></section>
      <section class="hero-row"><div></div>${modeToggle()}</section>
      ${assetNotice()}
      <section class="panel hall-panel"><div class="panel-title-row"><h2>🏆 Top 10 Blocks Hall of Fame</h2><span class="muted">Most active blocks</span></div><div class="hall-grid" id="hallBlocks"></div></section>
      <section class="search-row block-search-row"><div class="search-wrapper"><input id="blockSearch" autocomplete="off" placeholder="Search blocks..."/></div><div class="seg filter-toggle"><button data-filter="TOTAL" class="${blockFilter === 'TOTAL' ? 'active' : ''}">Total</button><button data-filter="MINED" class="${blockFilter === 'MINED' ? 'active' : ''}">Mined</button><button data-filter="PLACED" class="${blockFilter === 'PLACED' ? 'active' : ''}">Placed</button></div></section>
      <section class="block-index-list" id="blockIndexList"></section>`;
    bindMode(loadBlockIndex);
    bindBlockIndexSearch();
    renderHall(data.hall_of_fame || []);
    renderBlockIndexRows(data.blocks || []);
  } catch (e) {
    if (e.passwordRequired) { renderLogin(); return; }
    app().innerHTML = `<section class="panel error-panel"><h2>Could not load Block Index</h2><p>${esc(e.message)}</p><button class="back-link-button" onclick="goServer()">← Back to server</button></section>`;
    toast(e.message);
  }
}

function stat(label, value, toneName, small = '') {
  return `<article class="stat-card ${toneName}"><span>${esc(label)}</span><strong>${fmt(value || 0)}</strong>${small ? `<small>${esc(small)}</small>` : ''}</article>`;
}
function statRaw(label, value, toneName, small = '') {
  return `<article class="stat-card ${toneName}"><span>${esc(label)}</span><strong>${String(value ?? 0)}</strong>${small ? `<small>${esc(small)}</small>` : ''}</article>`;
}
function rankCard(title, rank, total, value, toneName) {
  const better = rank && total ? Math.max(0, total - rank) : 0;
  return `<article class="rank-card ${toneName}"><div><span>${esc(title)}</span><strong>#${rank || 0}</strong></div><p>${fmtFull(value || 0)} blocks · ${better > 0 ? `${better} behind you` : 'Top of the board'}</p></article>`;
}

function entityGroupToggle(reload) {
  const groups = [['ALL', 'All'], ['MOB', 'Mobs'], ['NPC', 'Friendly NPCs']];
  setTimeout(() => bindEntityGroup(reload), 0);
  return `<div class="seg entity-toggle">${groups.map(([value, label]) => `<button data-group="${value}" class="${entityGroup === value ? 'active' : ''}">${label}</button>`).join('')}</div>`;
}

function entityModeToggle(reload) {
  const modes = [['SURVIVAL', 'Survival'], ['CREATIVE', 'Creative'], ['ALL', 'All']];
  setTimeout(() => bindEntityMode(reload), 0);
  return `<div class="seg entity-mode-toggle">${modes.map(([value, label]) => `<button data-mode="${value}" class="${currentEntityMode === value ? 'active ' : ''}${tone(value)}">${label}</button>`).join('')}</div>`;
}

function bindEntityMode(reload) {
  document.querySelectorAll('.entity-mode-toggle button').forEach(button => {
    button.onclick = () => setEntityMode(button.dataset.mode, reload);
  });
}

function setEntityMode(mode, reload = loadEntityStats) {
  currentEntityMode = mode || 'ALL';
  reload();
}

function bindEntityGroup(reload) {
  document.querySelectorAll('.entity-toggle button').forEach(button => {
    button.onclick = () => setEntityGroup(button.dataset.group, reload);
  });
}

function setEntityGroup(group, reload = loadEntityStats) {
  entityGroup = group || 'ALL';
  reload();
}

function bindSearch() {
  const input = $('playerSearch'), results = $('playerSearchResults');
  if (!input || !results) return;
  const run = async () => {
    try {
      const j = await post('/api/functions/searchPlayers', { game_mode: currentMode, query: input.value.trim() });
      const players = j.players || [];
      results.innerHTML = players.length ? players.map(p => `<button class="search-result" data-uuid="${esc(p.uuid)}"><span class="avatar mini">${playerHead(p.uuid, p.player_name || 'Unknown')}</span><span><strong>${esc(p.player_name || 'Unknown')}</strong><small>${fmtFull(p.mined || 0)} mined / ${fmtFull(p.placed || 0)} placed</small></span><b>${fmt(p.total || 0)}</b></button>`).join('') : '<div class="search-empty">No players found.</div>';
      results.classList.remove('hidden');
      results.querySelectorAll('.search-result').forEach(b => b.onclick = () => goPlayer(b.dataset.uuid));
    } catch (e) { results.classList.add('hidden'); }
  };
  input.onfocus = run;
  input.oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(run, 120); };
  $('playersBtn').onclick = () => { input.focus(); run(); };
  $('projectsBtn').onclick = goProjects;
  $('blockIndexBtn').onclick = goBlockIndex;
  $('compareBtn').onclick = () => toast('Compare comes in the next phase.');
}

function projectRangeToggle() {
  const ranges = [['DAY', 'Day'], ['WEEK', 'Week'], ['MONTH', 'Month'], ['YEAR', 'Year'], ['ALL_TIME', 'All Time']];
  return `<div class="seg range-toggle">${ranges.map(([value, label]) => `<button data-range="${value}" class="${currentProjectRange === value ? 'active' : ''}">${label}</button>`).join('')}</div>`;
}
function bindProjectRange(slug) {
  document.querySelectorAll('.range-toggle button').forEach(button => {
    button.onclick = () => {
      currentProjectRange = button.dataset.range;
      loadProject(slug);
    };
  });
}

function renderProjectCards(projects) {
  const el = $('projectsGrid');
  if (!el) return;
  if (!projects.length) { el.innerHTML = '<section class="panel empty">No projects yet.</section>'; return; }
  el.innerHTML = projects.map(project => {
    const topContributor = project.top_contributor || {};
    const topBlock = project.top_block || {};
    return `<button class="project-card" data-slug="${attr(project.project_slug)}">
      <div class="project-card-title"><span class="project-emoji">🏗️</span><strong>${esc(project.project_name || project.project_slug)}</strong></div>
      <div class="project-card-stats"><span><em>Total Blocks</em><b>${fmtFull(project.total || 0)}</b></span><span><em>Mined</em><b class="m">${fmtFull(project.mined || 0)}</b></span><span><em>Placed</em><b class="p">${fmtFull(project.placed || 0)}</b></span></div>
      <div class="project-card-lines"><div><span>♧ Members</span><b>${fmtFull(project.members || 0)}</b></div><div><span>↗ Net Build Gain</span><b class="${(project.net_build_gain || 0) < 0 ? 'p' : 'm'}">${fmtFull(project.net_build_gain || 0)}</b></div><div><span>♕ Top Contributor</span><b>${esc(topContributor.player_name || '-')}</b></div><div><span>◇ Top Block</span><b>${esc(topBlock.display_name || '-')}</b></div><div><span>Last Activity</span><b>${esc(project.last_activity_label || 'No activity')}</b></div></div>
    </button>`;
  }).join('');
  el.querySelectorAll('.project-card').forEach(card => card.onclick = () => goProject(card.dataset.slug));
}

function renderProjectContributors(contributors) {
  const el = $('projectContributors');
  if (!el) return;
  if (!contributors.length) { el.innerHTML = '<div class="empty">No contributors yet.</div>'; return; }
  el.innerHTML = contributors.map(player => `<div class="contributor-row"><span class="rank-num">${player.rank || ''}</span><span class="avatar">${playerHead(player.uuid, player.player_name || 'Unknown')}</span><strong>${esc(player.player_name || 'Unknown')}</strong><span class="numbers"><span class="m">${fmtFull(player.mined || 0)}</span><span>/</span><span class="p">${fmtFull(player.placed || 0)}</span><strong>${fmtFull(player.total || 0)}</strong></span></div>`).join('');
}

function renderAchievements(achievements) {
  const el = $('achievementGrid');
  if (!el) return;
  if (!achievements.length) { el.innerHTML = '<div class="empty">No achievements available.</div>'; return; }
  el.innerHTML = achievements.map(item => `<article class="achievement ${item.unlocked ? 'unlocked' : ''}"><span>${blockIcon(item.material)}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.description)}</p><div class="achievement-progress"><i style="width:${Math.max(0, Math.min(100, Number(item.progress || 0)))}%"></i></div></div></article>`).join('');
}

function sharePanel(title, text, compact = false) {
  return `<section class="share-row ${compact ? 'compact' : ''}" data-share-title="${attr(title)}" data-share-text="${attr(text)}"><button onclick="shareFromButton(this)">Share</button><button onclick="copyCurrentLink()">Copy Link</button><a href="https://github.com/404DiscNotFound" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://discord.gg/gsQEWZScuX" target="_blank" rel="noopener noreferrer">Discord</a><a href="https://mcstats.404gnf.de" target="_blank" rel="noopener noreferrer">Website</a><a href="https://404gnf.de" target="_blank" rel="noopener noreferrer">404GNF</a></section>`;
}

function shareFromButton(button) {
  const row = button.closest('.share-row');
  shareCurrentPage(row?.dataset.shareTitle || '404Stats', row?.dataset.shareText || 'Minecraft block statistics powered by 404Stats.');
}

async function shareCurrentPage(title = '404Stats', text = 'Minecraft block statistics powered by 404Stats.') {
  const url = location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }
    await copyText(url);
    toast('Link copied.');
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    toast('Sharing failed.');
  }
}

async function copyCurrentLink() {
  try {
    await copyText(location.href);
    toast('Link copied.');
  } catch (e) {
    toast('Could not copy link.');
  }
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement('input');
  input.value = text;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

function bindBlockIndexSearch() {
  const input = $('blockSearch');
  if (!input) return;
  const run = async () => {
    try {
      const data = await post('/api/functions/getBlockIndex', { game_mode: currentMode, filter: blockFilter, query: input.value.trim() });
      renderHall(data.hall_of_fame || []);
      renderBlockIndexRows(data.blocks || []);
    } catch (e) { toast(e.message); }
  };
  input.oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(run, 120); };
  document.querySelectorAll('.filter-toggle button').forEach(button => {
    button.onclick = () => { blockFilter = button.dataset.filter; loadBlockIndex(); };
  });
}

function renderDonut(donutId, legendId, rows, labelKey) {
  const d = $(donutId), l = $(legendId);
  if (!d || !l) return;
  const sourceRows = rows || [];
  const totalValue = sourceRows.reduce((sum, row) => sum + chartValue(row), 0);
  const segments = sourceRows.map((row, i) => {
    const pct = Number(row.percent || 0);
    const fallbackPct = totalValue > 0 ? (chartValue(row) / totalValue) * 100 : 0;
    return {
      row,
      color: colors[i % colors.length],
      label: row[labelKey] || row.name || 'Unknown',
      percent: Math.max(0, pct > 0 ? pct : fallbackPct)
    };
  }).filter(seg => seg.percent > 0).sort((a, b) => b.percent - a.percent);
  if (!segments.length) {
    d.className = 'donut empty-chart';
    d.innerHTML = '<div class="empty-chart-icon">?</div><div class="empty-chart-label">No data yet</div>';
    l.innerHTML = '<div class="legend-row"><span class="legend-label">No data recorded</span><strong>0%</strong></div>';
    return;
  }
  d.className = 'donut quad-donut';

  const GRID = 8, HOLE = 4;
  const totalCells = GRID * GRID - HOLE * HOLE;
  const holeStart = (GRID - HOLE) / 2;
  const cells = [];
  let segIdx = 0;
  let cellCount = 0;
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const inHole = x >= holeStart && x < holeStart + HOLE && y >= holeStart && y < holeStart + HOLE;
      if (inHole) {
        cells.push('<span class="quad-donut-cell hole"></span>');
        continue;
      }
      const target = segments.length
        ? Math.round((segments.slice(0, segIdx + 1).reduce((s, seg) => s + seg.percent, 0) / 100) * totalCells)
        : 0;
      if (cellCount >= target && segIdx < segments.length - 1) segIdx++;
      const seg = segments[Math.min(segIdx, segments.length - 1)];
      cells.push(`<span class="quad-donut-cell fill" style="background:${seg.color}" title="${attr(seg.label)} · ${formatPercent(seg.percent)}"></span>`);
      cellCount++;
    }
  }
  d.innerHTML = cells.join('');
  l.innerHTML = segments.map(seg => `<div class="legend-row"><span class="legend-label"><span class="swatch" style="background:${seg.color}"></span>${esc(seg.label)}</span><strong>${formatPercent(seg.percent)}</strong></div>`).join('');
}

function formatPercent(value = 0) {
  const pct = Number(value || 0);
  return pct.toFixed(pct % 1 ? 1 : 0) + '%';
}

function chartValue(row = {}) {
  return Math.max(0, Number(row.distance_cm || row.total || row.total_amount || row.actions || row.kills || row.deaths || row.count || row.value || 0));
}
function renderFacts(facts, targetId = 'funFacts') {
  const icons = ['📈', '⚖', '❤️', '🕘'];
  const el = $(targetId);
  if (!el) return;
  if (!facts.length) {
    el.innerHTML = '<div class="fact empty-fact"><strong>⌛</strong> No stats recorded yet. Mine, place or explore for a bit, then refresh this panel.</div>';
    return;
  }
  el.innerHTML = facts.map((f, i) => `<div class="fact"><strong>${icons[i % icons.length]}</strong> ${esc(f)}</div>`).join('');
}
function renderTrend(rows) {
  const el = $('trendChart');
  if (!el) return;
  if (!rows.length) { el.innerHTML = '<div class="empty">No trend data yet.</div>'; return; }

  const w = 900, h = 240, p = 34;
  const max = Math.max(1, ...rows.map(r => Math.max(Number(r.mined || 0), Number(r.placed || 0))));
  const baseY = h - p;
  const chartH = h - p * 2;

  if (rows.length === 1) {
    const r = rows[0];
    const mined = Number(r.mined || 0);
    const placed = Number(r.placed || 0);
    const minedH = Math.max(4, (mined / max) * chartH);
    const placedH = Math.max(4, (placed / max) * chartH);
    const barW = 42;
    const cx = w / 2;
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <line class="axis" x1="${p}" y1="${baseY}" x2="${w - p}" y2="${baseY}"/>
      <line class="axis" x1="${p}" y1="${p}" x2="${p}" y2="${baseY}"/>
      <rect class="trend-bar-mined" x="${cx - barW - 8}" y="${baseY - minedH}" width="${barW}" height="${minedH}" rx="0"/>
      <rect class="trend-bar-placed" x="${cx + 8}" y="${baseY - placedH}" width="${barW}" height="${placedH}" rx="0"/>
      <text x="${cx - barW / 2 - 8}" y="${baseY - minedH - 10}" fill="#5BA033" font-size="12" font-weight="800" text-anchor="middle">${fmtFull(mined)}</text>
      <text x="${cx + barW / 2 + 8}" y="${baseY - placedH - 10}" fill="#C0392B" font-size="12" font-weight="800" text-anchor="middle">${fmtFull(placed)}</text>
      <text x="${cx}" y="${h - 6}" fill="#A8A8A8" font-size="12" text-anchor="middle">${esc(r.label || 'Today')}</text>
    </svg>`;
    return;
  }

  const x = i => p + i * (w - p * 2) / (rows.length - 1);
  const y = v => baseY - ((Number(v || 0) / max) * chartH);
  const path = k => rows.map((r, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(r[k])}`).join(' ');
  const points = (k, cls, dy = 0) => rows.map((r, i) => `<circle class="${cls}" cx="${x(i)}" cy="${y(r[k]) + dy}" r="4"/>`).join('');

  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <line class="axis" x1="${p}" y1="${baseY}" x2="${w - p}" y2="${baseY}"/>
    <line class="axis" x1="${p}" y1="${p}" x2="${p}" y2="${baseY}"/>
    <path class="line-mined" d="${path('mined')}"/>
    <path class="line-placed" d="${path('placed')}"/>
    ${points('mined', 'point-mined', -2)}
    ${points('placed', 'point-placed', 2)}
    ${rows.map((r, i) => `<text x="${x(i)}" y="${h - 6}" fill="#A8A8A8" font-size="11" text-anchor="middle">${esc(r.label || '')}</text>`).join('')}
  </svg>`;
}
function renderBlocks(blocks) {
  const t = $('topBlocks');
  if (!t) return;
  if (!blocks.length) { t.innerHTML = '<div class="empty">No block stats yet.</div>'; return; }
  const max = Math.max(1, ...blocks.map(b => b.total || 0));
  t.innerHTML = blocks.map(b => `<div class="block-row"><div class="block-name">${blockIcon(b.material)}<span>${esc(b.display_name || b.material)}</span></div><div class="bar"><div class="bar-mined" style="width:${((b.mined || 0) / max) * 100}%"></div><div class="bar-placed" style="width:${((b.placed || 0) / max) * 100}%"></div></div><div class="numbers"><span class="m">${fmtFull(b.mined)}</span> <span>/</span> <span class="p">${fmtFull(b.placed)}</span> <strong>${fmtFull(b.total)}</strong></div></div>`).join('');
}
function renderPlayers(id, players, focus) {
  const el = $(id);
  if (!el) return;
  if (!players.length) { el.innerHTML = '<div class="empty">No players yet.</div>'; return; }
  el.innerHTML = players.map(p => `<button class="player-row clickable" data-uuid="${esc(p.uuid)}"><div class="avatar">${playerHead(p.uuid, p.player_name || 'Unknown')}</div><div><div class="player-name">${esc(p.player_name || 'Unknown')}</div><div class="player-total">${fmtFull(p.mined || 0)} mined / ${fmtFull(p.placed || 0)} placed</div></div><strong class="${focus === 'placed' ? 'p' : 'm'}">${fmt(p[focus] || 0)}</strong></button>`).join('');
  el.querySelectorAll('.player-row').forEach(r => r.onclick = () => goPlayer(r.dataset.uuid));
}

function bindEntityPlayerSearch() {
  const input = $('entityPlayerSearch'), results = $('entityPlayerSearchResults');
  if (!input || !results) return;
  const run = async () => {
    try {
      const j = await post('/api/functions/searchEntityPlayers', { entity_group: entityGroup, game_mode: currentEntityMode, query: input.value.trim() });
      const players = j.players || [];
      results.innerHTML = players.length ? players.map(p => `<button class="search-result" data-uuid="${esc(p.uuid)}"><span class="avatar mini">${playerHead(p.uuid, p.player_name || 'Unknown')}</span><span><strong>${esc(p.player_name || 'Unknown')}</strong><small>${fmtFull(p.kills || 0)} kills / ${fmtFull(p.deaths || 0)} deaths</small></span><b>${fmt(p.total || 0)}</b></button>`).join('') : '<div class="search-empty">No combat players found.</div>';
      results.classList.remove('hidden');
      results.querySelectorAll('.search-result').forEach(b => b.onclick = () => goEntityPlayer(b.dataset.uuid));
    } catch (e) { results.classList.add('hidden'); }
  };
  input.onfocus = run;
  input.oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(run, 120); };
}

function renderEntityPlayers(id, players, focus = 'kills') {
  const el = $(id);
  if (!el) return;
  if (!players.length) { el.innerHTML = '<div class="empty">No combat players yet.</div>'; return; }
  el.innerHTML = players.map(p => `<button class="player-row clickable" data-uuid="${esc(p.uuid)}"><div class="avatar">${playerHead(p.uuid, p.player_name || 'Unknown')}</div><div><div class="player-name">${esc(p.player_name || 'Unknown')}</div><div class="player-total">${fmtFull(p.kills || 0)} kills / ${fmtFull(p.deaths || 0)} deaths</div></div><strong class="${focus === 'deaths' ? 'p' : 'm'}">${fmt(p[focus] || 0)}</strong></button>`).join('');
  el.querySelectorAll('.player-row').forEach(r => r.onclick = () => goEntityPlayer(r.dataset.uuid));
}

function renderEntities(entities, targetId = 'topEntities') {
  const el = $(targetId);
  if (!el) return;
  if (!entities.length) { el.innerHTML = '<div class="empty">No NPC Combat stats yet.</div>'; return; }
  const max = Math.max(1, ...entities.map(e => e.total || 0));
  el.innerHTML = entities.map(e => `<div class="block-row entity-row"><div class="block-name">${entityIcon(e.entity_type, e.entity_group)}<span>${esc(e.display_name || e.entity_type)}</span></div><div class="bar"><div class="bar-mined" style="width:${((e.kills || 0) / max) * 100}%"></div><div class="bar-placed" style="width:${((e.deaths || 0) / max) * 100}%"></div></div><div class="numbers"><span class="m">${fmtFull(e.kills)}</span> <span>/</span> <span class="p">${fmtFull(e.deaths)}</span> <strong>${fmtFull(e.total)}</strong></div></div>`).join('');
}

function renderCombatItems(id, items, emptyText) {
  const el = $(id);
  if (!el) return;
  if (!items.length) { el.innerHTML = `<div class="empty">${esc(emptyText)}</div>`; return; }
  const max = Math.max(1, ...items.map(i => i.amount || 0));
  el.innerHTML = items.map(item => `<article class="combat-item-row">${itemIcon(item.item_type)}<div><strong>${esc(item.display_name || item.item_type)}</strong><small>${fmtFull(item.entity_types || 0)} entity types${item.players ? ` · ${fmtFull(item.players)} players` : ''}</small><div class="mini-bar"><div class="bar-mined" style="width:${Math.max(4, ((item.amount || 0) / max) * 100)}%"></div></div></div><b>${fmtFull(item.amount || 0)}</b></article>`).join('');
}

function renderEntityHall(entities) {
  const el = $('entityHall');
  if (!el) return;
  if (!entities.length) { el.innerHTML = '<div class="empty">No entities yet.</div>'; return; }
  el.innerHTML = entities.slice(0, 10).map(e => `<article class="hall-card rank-${e.rank || 0}"><div class="hall-rank">${e.rank || '?'}</div><div class="hall-icon">${entityIcon(e.entity_type, e.entity_group)}</div><div class="hall-main"><strong>${esc(e.display_name || e.entity_type)}</strong><div class="mini-bar"><div class="bar-mined" style="width:${Math.min(100, ((e.kills || 0) / Math.max(1, e.total || 1)) * 100)}%"></div><div class="bar-placed" style="width:${Math.min(100, ((e.deaths || 0) / Math.max(1, e.total || 1)) * 100)}%"></div></div><small><span class="m">${fmtFull(e.kills)}</span> kills · <span class="p">${fmtFull(e.deaths)}</span> deaths · ${fmtFull(e.players || 0)} players · ${esc(e.entity_group || 'MOB')}</small></div><div class="hall-total"><b>${fmtFull(e.total)}</b><small>${Number(e.percent || 0).toFixed((e.percent || 0) % 1 ? 1 : 0)}%</small></div></article>`).join('');
}

function renderEntityIndexRows(entities) {
  const el = $('entityIndexList');
  if (!el) return;
  if (!entities.length) { el.innerHTML = '<section class="panel empty">No entities found.</section>'; return; }
  const max = Math.max(1, ...entities.map(e => e.total || 0));
  el.innerHTML = entities.map(e => `<article class="block-index-row"><div class="rank-num">${e.rank || ''}</div><div class="block-index-name">${entityIcon(e.entity_type, e.entity_group)}<div><strong>${esc(e.display_name || e.entity_type)}</strong><small>${Number(e.percent || 0).toFixed((e.percent || 0) % 1 ? 1 : 0)}% · ${fmtFull(e.players || 0)} players · ${esc(e.entity_group || 'MOB')}</small></div></div><div class="bar block-index-bar"><div class="bar-mined" style="width:${((e.kills || 0) / max) * 100}%"></div><div class="bar-placed" style="width:${((e.deaths || 0) / max) * 100}%"></div></div><div class="numbers"><span class="m">${fmtFull(e.kills)}</span><span>/</span><span class="p">${fmtFull(e.deaths)}</span><strong>${fmtFull(e.total)}</strong></div></article>`).join('');
}

function renderMovePlayers(id, players, focus = 'total') {
  const el = $(id);
  if (!el) return;
  if (!players.length) { el.innerHTML = '<div class="empty">No movement players yet.</div>'; return; }
  el.innerHTML = players.map(p => `<button class="player-row clickable" data-uuid="${esc(p.uuid)}"><div class="avatar">${playerHead(p.uuid, p.player_name || 'Unknown')}</div><div><div class="player-name">${esc(p.player_name || 'Unknown')}</div><div class="player-total">${fmtDistFull(p.distance_cm || 0)} ${p.event_count ? '· ' + fmtFull(p.event_count) + ' events' : ''}</div></div><strong class="m">${fmtDistItem(p.distance_cm || 0)}</strong></button>`).join('');
  el.querySelectorAll('.player-row').forEach(r => r.onclick = () => goMovementPlayer(r.dataset.uuid));
}

function renderMoveTypes(id, types) {
  const el = $(id);
  if (!el) return;
  const filtered = (types || []).filter(t => (t.distance_cm || 0) > 0 && t.movement_type !== 'JUMP' && t.movement_type !== 'TELEPORT');
  if (!filtered.length) { el.innerHTML = '<div class="empty">No movement stats yet.</div>'; return; }
  const max = Math.max(1, ...filtered.map(t => t.distance_cm || 0));
  el.innerHTML = filtered.map(t => `<div class="block-row entity-row"><div class="block-name">${moveEmoji(t.movement_type)}<span>${esc(t.display_name || t.movement_type)}${t.mount_type ? ' · ' + esc(t.mount_type) : ''}</span></div><div class="bar"><div class="bar-mined" style="width:${Math.max(4, ((t.distance_cm || 0) / max) * 100)}%"></div></div><div class="numbers"><span class="m">${fmtDistFull(t.distance_cm || 0)}</span> <strong>${Number(t.percent || 0).toFixed((t.percent || 0) % 1 ? 1 : 0)}%</strong></div></div>`).join('');
}

function renderBiomeGrid(id, visited = []) {
  const el = $(id);
  if (!el) return;
  const visitedMap = {};
  for (const b of visited) { visitedMap[biomeKey(b.biome_name || b.name || b.display_name)] = b; }
  const dimOrder = ['Overworld', 'Nether', 'End'];
  const byDim = {};
  for (const b of ALL_BIOMES) {
    const dim = b.dimension || 'Other';
    if (!byDim[dim]) byDim[dim] = [];
    byDim[dim].push(b);
  }
  const sections = dimOrder.filter(d => byDim[d] && byDim[d].length).map(dim => {
    const cards = byDim[dim].map(b => {
      const v = visitedMap[b.key];
      const cls = v ? 'unlocked' : 'locked';
      return `<article class="biome-card ${cls}" title="${esc(b.name)}${v ? ' · ' + fmtDistFull(v.distance_cm || 0) : ' · not visited'}"><span class="biome-emoji">${esc(b.emoji)}</span><span>${esc(b.name)}</span>${v ? `<small>${fmtDistFull(v.distance_cm || 0)}</small>` : '<small>Not visited</small>'}</article>`;
    }).join('');
    const dimLabel = dim === 'Overworld' ? '🌍 Overworld' : dim === 'Nether' ? '🔥 Nether' : dim === 'End' ? '🟣 The End' : dim;
    const visitedCount = byDim[dim].filter(b => visitedMap[b.key]).length;
    return `<div class="biome-dim-group"><h3>${dimLabel} <small>${visitedCount}/${byDim[dim].length}</small></h3><div class="biome-grid-inner">${cards}</div></div>`;
  }).join('');
  el.innerHTML = sections || '<div class="empty">No biome data available.</div>';
}

function biomeKey(value = '') {
  return String(value || '').toLowerCase().replace(/^minecraft:/, '').replace(/[^a-z0-9_]/g, '_');
}

const ALL_BIOMES = [
  {key:'badlands',name:'Badlands',dimension:'Overworld',emoji:'🏜️'},{key:'bamboo_jungle',name:'Bamboo Jungle',dimension:'Overworld',emoji:'🎋'},
  {key:'basalt_deltas',name:'Basalt Deltas',dimension:'Nether',emoji:'🌋'},{key:'beach',name:'Beach',dimension:'Overworld',emoji:'🏖️'},
  {key:'birch_forest',name:'Birch Forest',dimension:'Overworld',emoji:'🌳'},{key:'cherry_grove',name:'Cherry Grove',dimension:'Overworld',emoji:'🌸'},
  {key:'cold_ocean',name:'Cold Ocean',dimension:'Overworld',emoji:'❄️'},{key:'crimson_forest',name:'Crimson Forest',dimension:'Nether',emoji:'🍄'},
  {key:'dark_forest',name:'Dark Forest',dimension:'Overworld',emoji:'🌲'},{key:'deep_cold_ocean',name:'Deep Cold Ocean',dimension:'Overworld',emoji:'🌊'},
  {key:'deep_dark',name:'Deep Dark',dimension:'Overworld',emoji:'🕳️'},{key:'deep_frozen_ocean',name:'Deep Frozen Ocean',dimension:'Overworld',emoji:'🧊'},
  {key:'deep_lukewarm_ocean',name:'Deep Lukewarm Ocean',dimension:'Overworld',emoji:'🌊'},{key:'deep_ocean',name:'Deep Ocean',dimension:'Overworld',emoji:'🌊'},
  {key:'desert',name:'Desert',dimension:'Overworld',emoji:'🏜️'},{key:'dripstone_caves',name:'Dripstone Caves',dimension:'Overworld',emoji:'🕯️'},
  {key:'end_barrens',name:'End Barrens',dimension:'End',emoji:'🏝️'},{key:'end_highlands',name:'End Highlands',dimension:'End',emoji:'🏔️'},
  {key:'end_midlands',name:'End Midlands',dimension:'End',emoji:'🏞️'},{key:'eroded_badlands',name:'Eroded Badlands',dimension:'Overworld',emoji:'🏜️'},
  {key:'flower_forest',name:'Flower Forest',dimension:'Overworld',emoji:'🌻'},{key:'forest',name:'Forest',dimension:'Overworld',emoji:'🌳'},
  {key:'frozen_ocean',name:'Frozen Ocean',dimension:'Overworld',emoji:'🧊'},{key:'frozen_peaks',name:'Frozen Peaks',dimension:'Overworld',emoji:'🏔️'},
  {key:'frozen_river',name:'Frozen River',dimension:'Overworld',emoji:'🧊'},{key:'grove',name:'Grove',dimension:'Overworld',emoji:'🌲'},
  {key:'ice_spikes',name:'Ice Spikes',dimension:'Overworld',emoji:'🧊'},{key:'jagged_peaks',name:'Jagged Peaks',dimension:'Overworld',emoji:'⛰️'},
  {key:'jungle',name:'Jungle',dimension:'Overworld',emoji:'🌴'},{key:'lukewarm_ocean',name:'Lukewarm Ocean',dimension:'Overworld',emoji:'🌊'},
  {key:'lush_caves',name:'Lush Caves',dimension:'Overworld',emoji:'🌿'},{key:'mangrove_swamp',name:'Mangrove Swamp',dimension:'Overworld',emoji:'🌱'},
  {key:'meadow',name:'Meadow',dimension:'Overworld',emoji:'🌾'},{key:'mushroom_fields',name:'Mushroom Fields',dimension:'Overworld',emoji:'🍄'},
  {key:'nether_wastes',name:'Nether Wastes',dimension:'Nether',emoji:'🔥'},{key:'ocean',name:'Ocean',dimension:'Overworld',emoji:'🌊'},
  {key:'old_growth_birch_forest',name:'Old Growth Birch Forest',dimension:'Overworld',emoji:'🌳'},{key:'old_growth_pine_taiga',name:'Old Growth Pine Taiga',dimension:'Overworld',emoji:'🌲'},
  {key:'old_growth_spruce_taiga',name:'Old Growth Spruce Taiga',dimension:'Overworld',emoji:'🌲'},{key:'pale_garden',name:'Pale Garden',dimension:'Overworld',emoji:'🪦'},
  {key:'plains',name:'Plains',dimension:'Overworld',emoji:'🌾'},{key:'river',name:'River',dimension:'Overworld',emoji:'💧'},
  {key:'savanna',name:'Savanna',dimension:'Overworld',emoji:'🌾'},{key:'savanna_plateau',name:'Savanna Plateau',dimension:'Overworld',emoji:'🏞️'},
  {key:'small_end_islands',name:'Small End Islands',dimension:'End',emoji:'🏝️'},{key:'snowy_beach',name:'Snowy Beach',dimension:'Overworld',emoji:'❄️'},
  {key:'snowy_plains',name:'Snowy Plains',dimension:'Overworld',emoji:'❄️'},{key:'snowy_slopes',name:'Snowy Slopes',dimension:'Overworld',emoji:'🏔️'},
  {key:'snowy_taiga',name:'Snowy Taiga',dimension:'Overworld',emoji:'❄️'},{key:'soul_sand_valley',name:'Soul Sand Valley',dimension:'Nether',emoji:'💀'},
  {key:'sparse_jungle',name:'Sparse Jungle',dimension:'Overworld',emoji:'🌴'},{key:'stony_peaks',name:'Stony Peaks',dimension:'Overworld',emoji:'⛰️'},
  {key:'stony_shore',name:'Stony Shore',dimension:'Overworld',emoji:'🪨'},{key:'sunflower_plains',name:'Sunflower Plains',dimension:'Overworld',emoji:'🌻'},
  {key:'swamp',name:'Swamp',dimension:'Overworld',emoji:'🐸'},{key:'taiga',name:'Taiga',dimension:'Overworld',emoji:'🌲'},
  {key:'the_end',name:'The End',dimension:'End',emoji:'🟣'},{key:'the_void',name:'The Void',dimension:'End',emoji:'⬛'},
  {key:'warm_ocean',name:'Warm Ocean',dimension:'Overworld',emoji:'🌊'},{key:'warped_forest',name:'Warped Forest',dimension:'Nether',emoji:'💜'},
  {key:'windswept_forest',name:'Windswept Forest',dimension:'Overworld',emoji:'🌳'},{key:'windswept_gravelly_hills',name:'Windswept Gravelly Hills',dimension:'Overworld',emoji:'⛰️'},
  {key:'windswept_hills',name:'Windswept Hills',dimension:'Overworld',emoji:'⛰️'},{key:'windswept_savanna',name:'Windswept Savanna',dimension:'Overworld',emoji:'🌾'},
  {key:'wooded_badlands',name:'Wooded Badlands',dimension:'Overworld',emoji:'🌳'}
];

function renderMoveDonut(donutId, legendId, items, labelKey = 'display_name') {
  const filtered = (items || []).filter(i => (i.distance_cm || 0) > 0 && i.movement_type !== 'JUMP' && i.movement_type !== 'TELEPORT');
  renderDonut(donutId, legendId, filtered, labelKey);
}

function top10Others(items) {
  const sorted = [...(items || [])].sort((a, b) => (b.distance_cm || 0) - (a.distance_cm || 0));
  if (sorted.length <= 11) return sorted;
  const top = sorted.slice(0, 10);
  const othersDist = sorted.slice(10).reduce((s, i) => s + (i.distance_cm || 0), 0);
  const totalDist = sorted.reduce((s, i) => s + (i.distance_cm || 0), 0);
  if (othersDist > 0) {
    top.push({display_name:'Other biomes',distance_cm:othersDist,percent:totalDist>0?Math.round(othersDist*1000/totalDist)/10:0});
  }
  return top;
}

function renderProdItems(id, items) {
  const el = $(id); if (!el) return;
  if (!items.length) { el.innerHTML = '<div class="empty">No production stats yet.</div>'; return; }
  const max = Math.max(1, ...items.map(i => i.total_amount || 0));
  el.innerHTML = items.map(i => `<div class="block-row entity-row"><div class="block-name">${blockIcon(i.output_material || '')}<span>${esc(i.display_name || i.output_material)}</span></div><div class="bar"><div class="bar-mined" style="width:${Math.max(4, ((i.total_amount || 0) / max) * 100)}%"></div></div><div class="numbers"><span class="m">${fmtFull(i.total_amount || 0)}</span> <strong>${Number(i.percent || 0).toFixed((i.percent || 0) % 1 ? 1 : 0)}%</strong></div></div>`).join('');
}

function renderProdHall(items) {
  const el = $('prodHall'); if (!el) return;
  if (!items.length) { el.innerHTML = '<div class="empty">No items yet.</div>'; return; }
  el.innerHTML = items.slice(0, 10).map(e => `<article class="hall-card rank-${e.rank || 0}"><div class="hall-rank">${e.rank || '?'}</div><div class="hall-icon">${blockIcon(e.output_material || '')}</div><div class="hall-main"><strong>${esc(e.display_name || e.output_material)}</strong><div class="mini-bar"><div class="bar-mined" style="width:${Math.min(100, Number(e.percent || 0))}%"></div></div><small><span class="m">${fmtFull(e.total_amount || 0)}</span> produced · ${fmtFull(e.players || 0)} players</small></div><div class="hall-total"><b>${fmt(e.total_amount || 0)}</b><small>${Number(e.percent || 0).toFixed((e.percent || 0) % 1 ? 1 : 0)}%</small></div></article>`).join('');
}

function renderProdIndexRows(items) {
  const el = $('prodIndexList'); if (!el) return;
  if (!items.length) { el.innerHTML = '<section class="panel empty">No items found.</section>'; return; }
  const max = Math.max(1, ...items.map(e => e.total_amount || 0));
  el.innerHTML = items.map(e => `<article class="block-index-row"><div class="rank-num">${e.rank || ''}</div><div class="block-index-name">${blockIcon(e.output_material || '')}<div><strong>${esc(e.display_name || e.output_material)}</strong><small>${Number(e.percent || 0).toFixed((e.percent || 0) % 1 ? 1 : 0)}% · ${fmtFull(e.players || 0)} players</small></div></div><div class="bar block-index-bar"><div class="bar-mined" style="width:${((e.total_amount || 0) / max) * 100}%"></div></div><div class="numbers"><span class="m">${fmtFull(e.total_amount || 0)}</span><strong>${fmtFull(e.total_actions || 0)} actions</strong></div></article>`).join('');
}

function renderProdPlayers(id, players) {
  const el = $(id); if (!el) return;
  if (!players.length) { el.innerHTML = '<div class="empty">No producers yet.</div>'; return; }
  el.innerHTML = players.map(p => {
    const parts = [fmtFull(p.total_amount || 0) + ' items', fmtFull(p.total_actions || 0) + ' actions'];
    if (p.favorite_type) parts.push('mainly ' + esc(p.favorite_type));
    if (p.favorite_station) parts.push('at ' + esc(p.favorite_station));
    return `<button class="player-row clickable" data-uuid="${esc(p.uuid)}"><div class="avatar">${playerHead(p.uuid, p.player_name || 'Unknown')}</div><div><div class="player-name">${esc(p.player_name || 'Unknown')}</div><div class="player-total">${parts.join(' · ')}</div></div><strong class="m">${fmt(p.total_amount || 0)}</strong></button>`;
  }).join('');
  el.querySelectorAll('.player-row').forEach(r => r.onclick = () => goProductionPlayer(r.dataset.uuid));
}

function bindProdPlayerSearch() {
  const input = $('prodPlayerSearch'), results = $('prodPlayerSearchResults');
  if (!input || !results) return;
  const run = async () => {
    try {
      const j = await post('/api/functions/searchProductionPlayers', { game_mode: currentMode, production_type: currentProductionType, query: input.value.trim() });
      const players = j.players || [];
      results.innerHTML = players.length ? players.map(p => `<button class="search-result" data-uuid="${esc(p.uuid)}"><span class="avatar mini">${playerHead(p.uuid, p.player_name || 'Unknown')}</span><span><strong>${esc(p.player_name || 'Unknown')}</strong><small>${fmtFull(p.total_amount || 0)} items</small></span><b>${fmt(p.total_amount || 0)}</b></button>`).join('') : '<div class="search-empty">No production players found.</div>';
      results.classList.remove('hidden');
      results.querySelectorAll('.search-result').forEach(b => b.onclick = () => goProductionPlayer(b.dataset.uuid));
    } catch (e) { results.classList.add('hidden'); }
  };
  input.onfocus = run;
  input.oninput = () => { clearTimeout(prodSearchTimer); prodSearchTimer = setTimeout(run, 120); };
}

function bindMovePlayerSearch() {
  const input = $('movePlayerSearch'), results = $('movePlayerSearchResults');
  if (!input || !results) return;
  const run = async () => {
    try {
      const j = await post('/api/functions/searchMovementPlayers', { game_mode: currentMode, query: input.value.trim() });
      const players = j.players || [];
      results.innerHTML = players.length ? players.map(p => `<button class="search-result" data-uuid="${esc(p.uuid)}"><span class="avatar mini">${playerHead(p.uuid, p.player_name || 'Unknown')}</span><span><strong>${esc(p.player_name || 'Unknown')}</strong><small>${fmtDistFull(p.distance_cm || 0)} · ${fmtFull(p.event_count || 0)} events</small></span><b>${fmtDistItem(p.distance_cm || 0)}</b></button>`).join('') : '<div class="search-empty">No movement players found.</div>';
      results.classList.remove('hidden');
      results.querySelectorAll('.search-result').forEach(b => b.onclick = () => goMovementPlayer(b.dataset.uuid));
    } catch (e) { results.classList.add('hidden'); }
  };
  input.onfocus = run;
  input.oninput = () => { clearTimeout(moveSearchTimer); moveSearchTimer = setTimeout(run, 120); };
}

function moveEmoji(type = '') {
  const id = String(type || '').toLowerCase();
  if (id === 'walk') return '🚶';
  if (id === 'sprint') return '🏃';
  if (id === 'sneak') return '🥷';
  if (id === 'swim') return '🏊';
  if (id === 'walk_underwater') return '🤿';
  if (id === 'walk_on_water') return '🕴️';
  if (id === 'climb') return '🧗';
  if (id === 'fall') return '🪂';
  if (id === 'elytra') return '🪶';
  if (id === 'creative_fly') return '🕊️';
  if (id === 'boat') return '⛵';
  if (id === 'minecart') return '🚂';
  if (id === 'pig') return '🐷';
  if (id === 'horse') return '🐴';
  if (id === 'strider') return '🦎';
  if (id === 'happy_ghast') return '👻';
  if (id === 'nautilus') return '🐚';
  if (id === 'mount') return '🦙';
  if (id === 'jump') return '⬆️';
  if (id === 'teleport') return '🌀';
  return '👟';
}

function entityIcon(type = '', group = '') {
  const label = attr(type || 'Entity');
  if (assetStatus.iconMode === 'emoji') {
    return `<span class="block-icon emoji" title="${label}" aria-label="${label}">${entityEmoji(type, group)}</span>`;
  }
  return `<span class="block-icon"><img src="/assets/entity/${attr(type)}.png" alt="${label}" loading="lazy" onerror="this.parentElement.classList.add('missing'); this.remove();"></span>`;
}

function entityEmoji(type = '', group = '') {
  const id = String(type || '').toLowerCase();
  if (String(group || '').toUpperCase() === 'NPC') return '🙂';
  if (id.includes('zombie') || id.includes('drowned')) return '🧟';
  if (id.includes('skeleton') || id.includes('stray')) return '💀';
  if (id.includes('creeper')) return '💥';
  if (id.includes('spider')) return '🕷️';
  if (id.includes('dragon')) return '🐉';
  if (id.includes('slime') || id.includes('magma')) return '🟢';
  if (id.includes('piglin') || id.includes('hoglin')) return '🐗';
  if (id.includes('enderman')) return '🟣';
  if (id.includes('witch')) return '🧙';
  if (id.includes('wolf') || id.includes('cat') || id.includes('fox')) return '🐾';
  return '☠️';
}

function weaponEmoji(type = '') {
  const id = String(type || '').toLowerCase();
  if (id.includes('bow') || id.includes('crossbow')) return '🏹';
  if (id.includes('sword')) return '🗡️';
  if (id.includes('spear')) return '🔱';
  if (id.includes('axe')) return '🪓';
  if (id.includes('trident')) return '🔱';
  if (id.includes('mace')) return '🔨';
  if (id.includes('pickaxe')) return '⛏️';
  if (id.includes('shovel')) return '🥄';
  if (id.includes('hoe')) return '🌾';
  if (id.includes('hand')) return '✊';
  return '⚔️';
}

function itemIcon(material = '') {
  const label = attr(material || 'Item');
  if (assetStatus.iconMode === 'emoji' || String(material || '').toUpperCase() === 'HAND') {
    return `<span class="block-icon emoji" title="${label}" aria-label="${label}">${weaponEmoji(material)}</span>`;
  }
  return `<span class="block-icon"><img src="/assets/block/${attr(blockTexture(material))}.png" alt="${label}" loading="lazy" onerror="this.parentElement.classList.add('missing'); this.remove();"></span>`;
}

function renderHall(blocks) {
  const el = $('hallBlocks');
  if (!el) return;
  if (!blocks.length) { el.innerHTML = '<div class="empty">No blocks yet.</div>'; return; }
  el.innerHTML = blocks.slice(0, 10).map(b => {
    const top = b.top_player || {};
    return `<article class="hall-card rank-${b.rank || 0}"><div class="hall-rank">${b.rank || '?'}</div><div class="hall-icon">${blockIcon(b.material)}</div><div class="hall-main"><strong>${esc(b.display_name || b.material)}</strong><div class="mini-bar"><div class="bar-mined" style="width:${Math.min(100, ((b.mined || 0) / Math.max(1, b.total || 1)) * 100)}%"></div><div class="bar-placed" style="width:${Math.min(100, ((b.placed || 0) / Math.max(1, b.total || 1)) * 100)}%"></div></div><small><span class="m">${fmtFull(b.mined)}</span> mined · <span class="p">${fmtFull(b.placed)}</span> placed · ${fmtFull(b.players || 0)} players · ${Number(b.percent || 0).toFixed((b.percent || 0) % 1 ? 1 : 0)}%</small></div><div class="hall-total"><b>${fmtFull(b.total)}</b><small>${esc(top.player_name || '')}</small></div></article>`;
  }).join('');
}
function renderBlockIndexRows(blocks) {
  const el = $('blockIndexList');
  if (!el) return;
  if (!blocks.length) { el.innerHTML = '<section class="panel empty">No blocks found.</section>'; return; }
  const max = Math.max(1, ...blocks.map(b => b.total || 0));
  el.innerHTML = blocks.map(b => `<article class="block-index-row"><div class="rank-num">${b.rank || ''}</div><div class="block-index-name">${blockIcon(b.material)}<div><strong>${esc(b.display_name || b.material)}</strong><small>${Number(b.percent || 0).toFixed((b.percent || 0) % 1 ? 1 : 0)}% · ${fmtFull(b.players || 0)} players · ${esc(b.category || 'Other')}</small></div></div><div class="bar block-index-bar"><div class="bar-mined" style="width:${((b.mined || 0) / max) * 100}%"></div><div class="bar-placed" style="width:${((b.placed || 0) / max) * 100}%"></div></div><div class="numbers"><span class="m">${fmtFull(b.mined)}</span><span>/</span><span class="p">${fmtFull(b.placed)}</span><strong>${fmtFull(b.total)}</strong></div></article>`).join('');
}
function blockIcon(material = '') {
  const label = attr(material || 'Block');
  if (assetStatus.iconMode === 'emoji') {
    return `<span class="block-icon emoji" title="${label}" aria-label="${label}">${blockEmoji(material)}</span>`;
  }
  return `<span class="block-icon"><img src="/assets/block/${attr(blockTexture(material))}.png" alt="${label}" loading="lazy" onerror="this.parentElement.classList.add('missing'); this.remove();"></span>`;
}
function blockEmoji(material = '') {
  const id = String(material || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!id) return '⬛';
  if (id.includes('diamond') || id.includes('emerald') || id.includes('amethyst')) return '💎';
  if (id.includes('gold') || id.includes('raw_gold')) return '🟡';
  if (id.includes('iron') || id.includes('quartz') || id.includes('calcite')) return '⚪';
  if (id.includes('copper')) return '🟠';
  if (id.includes('coal') || id.includes('blackstone')) return '⚫';
  if (id.includes('redstone')) return '🔴';
  if (id.includes('lapis')) return '🔵';
  if (id.includes('ore')) return '⛏️';
  if (id.includes('log') || id.includes('wood') || id.includes('planks') || id.includes('stem') || id.includes('hyphae')) return '🪵';
  if (id.includes('leaves') || id.includes('sapling') || id.includes('grass') || id.includes('flower') || id.includes('moss') || id.includes('vine') || id.includes('fern') || id.includes('bush')) return '🌿';
  if (id.includes('crop') || id.includes('wheat') || id.includes('carrot') || id.includes('potato') || id.includes('beetroot') || id.includes('melon') || id.includes('pumpkin')) return '🌾';
  if (id.includes('stone') || id.includes('deepslate') || id.includes('andesite') || id.includes('granite') || id.includes('diorite') || id.includes('tuff') || id.includes('cobble')) return '🪨';
  if (id.includes('dirt') || id.includes('mud') || id.includes('podzol') || id.includes('mycelium')) return '🟤';
  if (id.includes('sand') || id.includes('gravel') || id.includes('clay') || id.includes('terracotta')) return '🏜️';
  if (id.includes('snow') || id.includes('ice') || id.includes('frosted')) return '❄️';
  if (id.includes('water') || id.includes('kelp') || id.includes('coral') || id.includes('sea') || id.includes('sponge')) return '🌊';
  if (id.includes('lava') || id.includes('magma') || id.includes('nether') || id.includes('basalt') || id.includes('crimson') || id.includes('warped')) return '🔥';
  if (id.includes('end') || id.includes('purpur') || id.includes('chorus')) return '🟣';
  if (id.includes('glass') || id.includes('pane')) return '🪟';
  if (id.includes('wool') || id.includes('carpet') || id.includes('bed')) return '🧶';
  if (id.includes('chest') || id.includes('barrel') || id.includes('shulker') || id.includes('crate')) return '📦';
  if (id.includes('rail') || id.includes('piston') || id.includes('observer') || id.includes('dispenser') || id.includes('dropper') || id.includes('hopper') || id.includes('lever') || id.includes('button') || id.includes('pressure_plate')) return '⚙️';
  if (id.includes('torch') || id.includes('lantern') || id.includes('glow') || id.includes('lamp')) return '💡';
  if (id.includes('door') || id.includes('trapdoor') || id.includes('fence') || id.includes('gate') || id.includes('stairs') || id.includes('slab') || id.includes('wall')) return '🏗️';
  return '⬛';
}

function goPlayer(uuid) {
  if (!uuid) return;
  history.pushState({}, '', `/server/local/player/${encodeURIComponent(uuid)}`);
  loadPlayer(uuid);
}
function goServer() {
  history.pushState({}, '', '/server/local');
  loadLanding();
}
function goBlocks() {
  history.pushState({}, '', '/server/local/blocks');
  loadBlockStats();
}
function goNpcs() {
  history.pushState({}, '', '/server/local/npcs');
  loadEntityStats();
}
function goEntityIndex() {
  history.pushState({}, '', '/server/local/npc-index');
  loadEntityIndex();
}
function goEntityRankings() {
  history.pushState({}, '', '/server/local/npc-rankings');
  loadEntityRankings();
}
function goEntityPlayer(uuid) {
  if (!uuid) return;
  history.pushState({}, '', `/server/local/npcs/player/${encodeURIComponent(uuid)}`);
  loadEntityPlayer(uuid);
}
function goBlockIndex() {
  history.pushState({}, '', '/server/local/block-index');
  loadBlockIndex();
}
function goMovement() {
  history.pushState({}, '', '/server/local/movement');
  loadMovementStats();
}
function goMovementPlayer(uuid) {
  if (!uuid) return;
  history.pushState({}, '', `/server/local/movement/player/${encodeURIComponent(uuid)}`);
  loadMovementPlayer(uuid);
}
function goMovementRankings() {
  history.pushState({}, '', '/server/local/movement-rankings');
  loadMovementRankings();
}
function goAbout() {
  history.pushState({}, '', '/server/local/about');
  loadAbout();
}
function goProjects() {
  history.pushState({}, '', '/server/local/projects');
  loadProjects();
}
function goProject(slug) {
  if (!slug) return;
  history.pushState({}, '', `/server/local/project/${encodeURIComponent(slug)}`);
  loadProject(slug);
}
function goProduction() { history.pushState({}, '', '/server/local/production'); loadProductionStats(); }
function goProductionPlayer(uuid) {
  if (!uuid) return;
  history.pushState({}, '', `/server/local/production/player/${encodeURIComponent(uuid)}`);
  loadProductionPlayer(uuid);
}
function goProductionIndex() {
  history.pushState({}, '', '/server/local/production-index');
  loadProductionIndex();
}
function goProductionRankings() {
  history.pushState({}, '', '/server/local/production-rankings');
  loadProductionRankings();
}
function goWorlds() {
  history.pushState({}, '', '/server/local/worlds');
  loadWorlds();
}
function goWorldDetail(name) {
  if (!name) return;
  history.pushState({}, '', `/server/local/world/${encodeURIComponent(name)}`);
  loadWorldDetail(name);
}
function goInteractions() { history.pushState({}, '', '/server/local/interactions'); loadInteractionStats(); }
function goInteractionPlayer(uuid) {
  if (!uuid) return;
  history.pushState({}, '', `/server/local/interactions/player/${encodeURIComponent(uuid)}`);
  loadInteractionPlayer(uuid);
}
window.goServer = goServer;
window.goBlocks = goBlocks;
window.goNpcs = goNpcs;
window.goEntityIndex = goEntityIndex;
window.goEntityRankings = goEntityRankings;
window.goEntityPlayer = goEntityPlayer;
window.goBlockIndex = goBlockIndex;
window.goMovement = goMovement;
window.goMovementPlayer = goMovementPlayer;
window.goMovementRankings = goMovementRankings;
window.goProduction = goProduction;
window.goProductionPlayer = goProductionPlayer;
window.goProductionIndex = goProductionIndex;
window.goProductionRankings = goProductionRankings;
window.goWorlds = goWorlds;
window.goWorldDetail = goWorldDetail;
window.goInteractions = goInteractions;
window.goInteractionPlayer = goInteractionPlayer;
window.goProjects = goProjects;
window.goAbout = goAbout;
window.setEntityGroup = setEntityGroup;
window.shareFromButton = shareFromButton;
window.shareCurrentPage = shareCurrentPage;
window.copyCurrentLink = copyCurrentLink;

$('refreshBtn').onclick = load;
$('aboutBtn').onclick = goAbout;
window.onpopstate = load;
checkAuthAndLoad();
