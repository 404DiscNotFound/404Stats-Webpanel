const $ = id => document.getElementById(id);
const esc = v => String(v||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = v => { const n=Number(v||0); return n>=1e6?(n/1e6).toFixed(1).replace('.0','')+'M':n>=1e3?(n/1e3).toFixed(1).replace('.0','')+'K':n.toLocaleString('en-US'); };

let csrfToken = null;

function toast(msg, err) {
  const t = $('toast'); if(!t) return;
  t.textContent = msg; t.className = 'toast show'+(err?' error':'');
  setTimeout(() => t.className = 'toast', 3200);
}

async function api(path, payload) {
  const headers = { 'Content-Type': 'application/json' };
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  const response = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload || {})
  });
  const text = await response.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch (e) { throw new Error(text || e.message); }
  if (!response.ok || json.success === false) {
    throw new Error(json.error || `HTTP ${response.status}`);
  }
  if (json.csrf_token) csrfToken = json.csrf_token;
  return json;
}

async function checkSession() {
  try {
    const j = await api('/api/admin/session');
    if (!j.authenticated) { loadLogin(''); return false; }
    $('headerSub').textContent = 'Logged in as '+esc(j.player_name||'Admin')+' · '+(j.remaining_seconds||0)+'s remaining';
    csrfToken = j.csrf_token;
    return j;
  } catch(e) { loadLogin(''); return false; }
}

function loadLogin(msg) {
  $('headerTitle').textContent = 'Admin Login';
  $('headerSub').textContent = '';
  $('topActions').innerHTML = '';
  $('app').innerHTML = `<section class="login-shell"><article class="panel login-panel">
    <span class="login-kicker">Protected Admin Area</span>
    <h2>Admin Login</h2>
    <p>Use <code>/404stats webadmin</code> in Minecraft to get a login link.</p>
    <p class="login-info">The login token is valid for <strong>5 minutes</strong> and is <strong>single use</strong>.</p>
    ${msg ? `<p class="login-error">${esc(msg)}</p>` : ''}
    <form id="loginForm" style="margin-top:18px;display:flex;gap:10px;">
      <input id="tokenInput" type="text" autocomplete="off" placeholder="Paste login token..." style="flex:1"/>
      <button type="submit">Login</button>
    </form>
  </article></section>`;

  const params = new URLSearchParams(location.search);
  const token = params.get('token') || '';
  const error = params.get('error') || '';
  if(error) { msg = error; $('app').innerHTML = $('app').innerHTML.replace(/<p class="login-error">.*?<\/p>/,'') + `<p class="login-error">${esc(msg)}</p>`; }
  if(token) { $('tokenInput').value = token; $('loginForm').requestSubmit(); }

  $('loginForm').onsubmit = async e => {
    e.preventDefault();
    const t = $('tokenInput').value.trim();
    if(!t) return;
    window.location.href = '/admin/login?token=' + encodeURIComponent(t);
  };
}

async function loadDashboard() {
  const session = await checkSession();
  if(!session) return;

  try {
    csrfToken = session.csrf_token;
    const data = await api('/api/admin/summary');
    const tables = data.tables || [];
    const dbSize = data.db_size_mb != null ? Number(data.db_size_mb).toFixed(2)+' MB' : 'unknown';
    $('headerTitle').textContent = 'Admin Panel';
    $('topActions').innerHTML = `<button onclick="loadDashboard()">Dashboard</button><button class="warn" onclick="doLogout()">Logout</button>`;

    $('app').innerHTML = `<section class="cards">${tables.map(t => {
      const d = t.latest>0 ? new Date(t.latest).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'never';
      return `<article class="stat-card" onclick="loadTable('${esc(t.table)}')" style="cursor:pointer"><span>${esc(t.table.replace(/_/g,' '))}</span><strong>${fmt(t.rows)}</strong><small>Last: ${esc(d)}</small></article>`;
    }).join('')}</section>
    <section class="panel"><h2>Database</h2><div class="db-info-grid"><div><span>Total rows</span><strong>${fmt(data.total_rows||0)}</strong></div><div><span>File size</span><strong>${esc(dbSize)}</strong></div><div><span>Path</span><code>${esc(data.db_path||'-')}</code></div></div></section>
    <section class="two-col">
      <article class="panel delete-panel"><h2>Delete Entries</h2>
        <div class="search-row">
          <select id="delTable"><option value="block_stats">block_stats</option><option value="entity_stats">entity_stats</option><option value="entity_combat_items">entity_combat_items</option><option value="movement_stats">movement_stats</option></select>
          <input id="delPlayer" placeholder="Player name"/>
          <input id="delFilter" placeholder="Filter (material/entity/movement, optional)"/>
          <button onclick="doDeletePreview()">Preview</button>
        </div>
        <div id="deleteResult"></div>
      </article>
      <article class="panel"><h2>Browse Data</h2>
        <div class="search-row">
          <select id="browseTable" onchange="browseData()"><option value="block_stats">block_stats</option><option value="entity_stats">entity_stats</option><option value="entity_combat_items">entity_combat_items</option><option value="movement_stats">movement_stats</option></select>
          <input id="browseSearch" placeholder="Search player..." oninput="browseData()"/>
          <button onclick="browseData()">Search</button>
        </div>
        <div class="scroll-hint" id="scrollHint">Scroll horizontally →</div>
        <div class="table-wrap" id="browseResult"></div>
      </article>
    </section>`;
  } catch(e) {
    $('app').innerHTML = `<article class="panel"><h2>Error</h2><p>${esc(e.message)}</p></article>`;
    toast(e.message, true);
  }
}

async function doLogout() {
  try { await api('/api/admin/logout'); } catch(e) {}
  csrfToken = null;
  loadLogin('');
}

async function loadTable(table) {
  try {
    const data = await api('/api/admin/browse', {table, limit:50});
    renderBrowseData(data, table);
  } catch(e) { toast(e.message, true); }
}

async function browseData() {
  const table = $('browseTable').value;
  const search = $('browseSearch').value.trim();
  try {
    const payload = {table, limit:50};
    if(search) payload.search = search;
    const data = await api('/api/admin/browse', payload);
    renderBrowseData(data, table);
  } catch(e) { toast(e.message, true); }
}

function renderBrowseData(data, table) {
  const rows = data.rows || [];
  if(!rows.length) { $('browseResult').innerHTML = '<p class="muted" style="color:var(--muted)">No rows found.</p>'; return; }
  const keys = Object.keys(rows[0]);
  $('browseResult').innerHTML = `<table class="data-table"><thead><tr>${keys.map(k=>`<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${keys.map(k=>`<td title="${esc(r[k]||'')}">${esc(r[k]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  $('scrollHint').style.display = keys.length>6 ? 'block' : 'none';
}

async function doDeletePreview() {
  const table = $('delTable').value;
  const player = $('delPlayer').value.trim();
  const filter = $('delFilter').value.trim();
  if(!player) { toast('Player name required.', true); return; }
  try {
    const payload = {table, player_name:player};
    if(filter) payload.filter = filter;
    const result = await api('/api/admin/delete-preview', payload);
    const count = result.affected_rows||0;
    if(count===0) {
      $('deleteResult').innerHTML = `<div class="delete-result muted"><p>No matching entries found for &quot;${esc(player)}&quot; in ${esc(table)}.</p></div>`;
      return;
    }
    $('deleteResult').innerHTML = `<div class="delete-result"><p>Found <strong>${fmt(count)}</strong> matching entry(s) for &quot;${esc(player)}&quot; in ${esc(table)}.</p><button class="warn" onclick="doDeleteConfirm('${esc(table)}','${esc(player)}','${esc(filter||'')}')">Confirm Delete ${fmt(count)} entries</button> <button onclick="$('deleteResult').innerHTML=''">Cancel</button></div>`;
  } catch(e) {
    $('deleteResult').innerHTML = `<div class="delete-result err">${esc(e.message)}</div>`;
    toast(e.message, true);
  }
}

async function doDeleteConfirm(table, player, filter) {
  try {
    const payload = {table, player_name:player, confirm:'DELETE'};
    if(filter) payload.filter = filter;
    const result = await api('/api/admin/delete-confirm', payload);
    $('deleteResult').innerHTML = `<div class="delete-result ok">Deleted <strong>${fmt(result.deleted)}</strong> entries.</div>`;
    toast(`Deleted ${result.deleted} entries.`);
  } catch(e) {
    $('deleteResult').innerHTML = `<div class="delete-result err">${esc(e.message)}</div>`;
    toast(e.message, true);
  }
}

window.doDeletePreview = doDeletePreview;
window.doDeleteConfirm = doDeleteConfirm;
window.doLogout = doLogout;
window.loadDashboard = loadDashboard;
window.browseData = browseData;
window.loadTable = loadTable;

async function init() {
  const session = await checkSession();
  if(session) { loadDashboard(); } else { loadLogin(''); }
}
init();
