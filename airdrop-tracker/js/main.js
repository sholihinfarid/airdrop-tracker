/* =============================================
   main.js — Dashboard Page Logic
   ============================================= */

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();
  render();
  bindEvents();
});

// ── Color & display helpers ───────────────────
const PALETTE = ['#00ff88','#00cfff','#a78bfa','#ffb800','#ff4d6a','#f97316','#22d3ee','#e879f9','#4ade80','#fb923c'];

function getAccentColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xFFFFFF;
  return PALETTE[h % PALETTE.length];
}

function getInitials(name) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function scoreColor(s) {
  if (s >= 10000) return 'var(--accent)';
  if (s >= 3000)  return 'var(--accent2)';
  if (s >= 1000)  return 'var(--warn)';
  return 'var(--muted)';
}

function scorePct(s) {
  return Math.min(100, (s / 20000) * 100);
}

function statusIcon(status) {
  return { Potential: '🤔', Confirmed: '✅', Claimed: '🎉', Missed: '❌' }[status] || '';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
}

function fmtCost(c) {
  return c > 0 ? `$${c}` : 'Free';
}

// ── Sort state ────────────────────────────────
let sortKey = 'createdAt';
let sortDir = -1;

function setSortBy(key) {
  if (sortKey === key) sortDir *= -1;
  else { sortKey = key; sortDir = 1; }
  render();
}

// ── Render ────────────────────────────────────
function render() {
  renderStats();
  renderTable();
}

function renderStats() {
  const s = getStats();
  document.getElementById('statsBar').innerHTML = `
    <div class="stat-card"><div class="stat-val blue">${s.total}</div><div class="stat-lbl">Total</div></div>
    <div class="stat-card"><div class="stat-val warn">${s.confirmed}</div><div class="stat-lbl">Confirmed</div></div>
    <div class="stat-card"><div class="stat-val accent">${s.claimed}</div><div class="stat-lbl">Claimed</div></div>
    <div class="stat-card"><div class="stat-val danger">$${s.totalCost}</div><div class="stat-lbl">Total Cost</div></div>
  `;
}

function getFiltered() {
  const q  = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const fs = document.getElementById('filterStatus')?.value || '';
  const ft = document.getElementById('filterTask')?.value   || '';

  let list = getAll().filter(p => {
    if (q  && !p.name.toLowerCase().includes(q)) return false;
    if (fs && p.status !== fs) return false;
    if (ft && p.task   !== ft) return false;
    return true;
  });

  list.sort((a, b) => {
    let av, bv;
    if      (sortKey === 'name')      { av = a.name;              bv = b.name; }
    else if (sortKey === 'task')      { av = a.task;              bv = b.task; }
    else if (sortKey === 'status')    { av = a.status;            bv = b.status; }
    else if (sortKey === 'raise')     { av = parseFloat(a.raise)  || 0; bv = parseFloat(b.raise)  || 0; }
    else if (sortKey === 'score')     { av = a.score              || 0; bv = b.score              || 0; }
    else if (sortKey === 'cost')      { av = a.cost               || 0; bv = b.cost               || 0; }
    else { av = a.createdAt || ''; bv = b.createdAt || ''; }
    if (av < bv) return -sortDir;
    if (av > bv) return  sortDir;
    return 0;
  });

  return list;
}

function renderTable() {
  const list   = getFiltered();
  const tbody  = document.getElementById('tableBody');
  const empty  = document.getElementById('emptyState');

  if (!list.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(p => buildRow(p)).join('');
}

function buildRow(p) {
  const clr    = getAccentColor(p.name);
  const sc     = Number(p.score) || 0;
  const pct    = scorePct(sc);
  const scClr  = scoreColor(sc);
  const logo   = getLogo(p.id);

  const logoHtml = logo
    ? `<img src="${logo}" alt="logo">`
    : `<span style="color:${clr}">${getInitials(p.name)}</span>`;

  const stepsTotal = p.steps?.length || 0;
  const stepsDone  = p.steps?.filter(s => s.done).length || 0;
  const progressPct = stepsTotal > 0 ? Math.round((stepsDone / stepsTotal) * 100) : 0;

  return `
    <tr>
      <td><span class="star" onclick="handleToggleFav('${p.id}')">${p.fav ? '⭐' : '☆'}</span></td>
      <td>
        <div class="proj-name-cell">
          <div class="proj-logo" style="background:${clr}18;border:1px solid ${clr}33"
               title="Klik untuk ganti logo" onclick="triggerLogoUpload('${p.id}')">
            ${logoHtml}
            <div class="upload-overlay">📷</div>
            <input type="file" id="logoInput_${p.id}" accept="image/*" style="display:none"
                   onchange="handleLogoUpload(event, '${p.id}')">
          </div>
          <div class="proj-info">
            <div class="name" onclick="goToDetail('${p.id}')">${p.name}</div>
            <div class="sub">
              ⏱ ${p.timeMin || '—'} mnt · ${fmtCost(p.cost)}
              ${p.network ? '· ' + p.network : ''}
              ${stepsTotal > 0 ? `· ${stepsDone}/${stepsTotal} steps (${progressPct}%)` : ''}
            </div>
          </div>
        </div>
      </td>
      <td><span class="badge task-${(p.task||'other').toLowerCase()}">${p.task}</span></td>
      <td><span class="badge ${(p.status||'').toLowerCase()}">${statusIcon(p.status)} ${p.status}</span></td>
      <td style="color:var(--muted);font-size:13px">${p.reward}</td>
      <td class="raise-cell" style="color:${clr}">${p.raise && p.raise !== '—' ? '$' + p.raise : '—'}</td>
      <td>
        <div class="score-wrap">
          <span class="score-num" style="color:${scClr}">${sc.toLocaleString()}</span>
          <div class="score-bar-bg">
            <div class="score-bar-fill" style="width:${pct}%;background:${scClr}"></div>
          </div>
        </div>
      </td>
      <td class="date-cell">${fmtDate(p.createdAt)}</td>
      <td>
        <div class="actions">
          <button class="btn-icon edit" title="Edit" onclick="openEditModal('${p.id}')">✏️</button>
          <button class="btn-icon del"  title="Hapus" onclick="handleDelete('${p.id}')">🗑</button>
        </div>
      </td>
    </tr>`;
}

// ── Navigation ────────────────────────────────
function goToDetail(id) {
  window.location.href = `detail.html?id=${id}`;
}

// ── Logo upload (from row) ────────────────────
function triggerLogoUpload(id) {
  document.getElementById(`logoInput_${id}`)?.click();
}

async function handleLogoUpload(event, id) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const b64 = await fileToBase64(file);
    saveLogo(id, b64);
    render();
  } catch (e) {
    alert('Gagal upload logo: ' + e.message);
  }
}

// ── Fav ───────────────────────────────────────
function handleToggleFav(id) {
  toggleFav(id);
  render();
}

// ── Delete ────────────────────────────────────
function handleDelete(id) {
  const p = getById(id);
  if (!p) return;
  if (!confirm(`Hapus project "${p.name}"?`)) return;
  deleteProject(id);
  render();
}

// ── Modal state ───────────────────────────────
let editingId   = null;
let modalSteps  = [];
let pendingLogo = null;  // base64 of logo picked in modal

function openAddModal() {
  editingId   = null;
  modalSteps  = [];
  pendingLogo = null;
  fillModal(null);
  showModal();
}

function openEditModal(id) {
  const p = getById(id);
  if (!p) return;
  editingId   = id;
  modalSteps  = (p.steps || []).map(s => ({ ...s }));
  pendingLogo = null;
  fillModal(p);
  showModal();
}

function fillModal(p) {
  document.getElementById('modalTitle').innerHTML = p
    ? 'Edit <span>Project</span>'
    : 'Tambah <span>Project</span>';

  document.getElementById('f_name').value        = p?.name        || '';
  document.getElementById('f_task').value        = p?.task        || 'Social';
  document.getElementById('f_status').value      = p?.status      || 'Potential';
  document.getElementById('f_reward').value      = p?.reward      || 'Airdrop';
  document.getElementById('f_cost').value        = p?.cost        || '';
  document.getElementById('f_raise').value       = p?.raise       || '';
  document.getElementById('f_score').value       = p?.score       || '';
  document.getElementById('f_network').value     = p?.network     || '';
  document.getElementById('f_timeMin').value     = p?.timeMin     || '';
  document.getElementById('f_link').value        = p?.link        || '';
  document.getElementById('f_description').value = p?.description || '';

  // logo preview
  const existingLogo = p ? getLogo(p.id) : null;
  const clr = p ? getAccentColor(p.name) : 'var(--accent)';
  const initials = p ? getInitials(p.name) : '?';
  const previewEl = document.getElementById('logoModalPreview');
  if (existingLogo) {
    previewEl.innerHTML = `<img src="${existingLogo}" alt="logo">`;
    previewEl.style.background = 'transparent';
  } else {
    previewEl.innerHTML = `<span style="color:${clr}">${initials}</span>`;
    previewEl.style.background = clr + '18';
  }

  renderModalSteps();
}

function renderModalSteps() {
  const container = document.getElementById('stepsContainer');
  if (!container) return;
  if (modalSteps.length === 0) {
    container.innerHTML = '<p style="font-size:12px;color:var(--muted);padding:8px 0">Belum ada langkah. Klik tombol di bawah untuk menambah.</p>';
    return;
  }
  container.innerHTML = modalSteps.map((s, i) => `
    <div class="step-item">
      <div class="step-num">${i + 1}</div>
      <input type="text" value="${escHtml(s.text)}"
             oninput="modalSteps[${i}].text = this.value"
             placeholder="Langkah ke-${i + 1}...">
      <button class="remove-step" onclick="removeModalStep(${i})">×</button>
    </div>`).join('');
}

function addModalStep() {
  modalSteps.push({ id: uid(), text: '', done: false });
  renderModalSteps();
  // focus last
  setTimeout(() => {
    const inputs = document.querySelectorAll('.step-item input');
    inputs[inputs.length - 1]?.focus();
  }, 50);
}

function removeModalStep(idx) {
  modalSteps.splice(idx, 1);
  renderModalSteps();
}

async function handleModalLogoChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    pendingLogo = await fileToBase64(file);
    const previewEl = document.getElementById('logoModalPreview');
    previewEl.innerHTML = `<img src="${pendingLogo}" alt="logo">`;
    previewEl.style.background = 'transparent';
  } catch (e) {
    alert('Gagal baca file: ' + e.message);
  }
}

function saveProject() {
  const name = document.getElementById('f_name').value.trim();
  if (!name) {
    document.getElementById('f_name').style.borderColor = 'var(--danger)';
    document.getElementById('f_name').focus();
    return;
  }
  document.getElementById('f_name').style.borderColor = '';

  const data = {
    name,
    task:        document.getElementById('f_task').value,
    status:      document.getElementById('f_status').value,
    reward:      document.getElementById('f_reward').value,
    cost:        Number(document.getElementById('f_cost').value) || 0,
    raise:       document.getElementById('f_raise').value || '—',
    score:       Number(document.getElementById('f_score').value) || 0,
    network:     document.getElementById('f_network').value,
    timeMin:     Number(document.getElementById('f_timeMin').value) || 0,
    link:        document.getElementById('f_link').value,
    description: document.getElementById('f_description').value,
    steps:       modalSteps.filter(s => s.text.trim()),
  };

  let savedId;
  if (editingId) {
    updateProject(editingId, data);
    savedId = editingId;
  } else {
    const p = addProject(data);
    savedId  = p.id;
  }

  // save logo if picked in modal
  if (pendingLogo) saveLogo(savedId, pendingLogo);

  hideModal();
  render();
}

function showModal() {
  document.getElementById('overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('f_name').focus(), 80);
}

function hideModal() {
  document.getElementById('overlay').style.display = 'none';
  editingId = null; modalSteps = []; pendingLogo = null;
}

function closeOnOverlay(e) {
  if (e.target === document.getElementById('overlay')) hideModal();
}

// ── Util ──────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Bind misc events ──────────────────────────
function bindEvents() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideModal();
  });

  // live update logo preview initials when name changes
  document.getElementById('f_name')?.addEventListener('input', function() {
    if (pendingLogo) return;
    const existingLogo = editingId ? getLogo(editingId) : null;
    if (existingLogo) return;
    const clr = getAccentColor(this.value || '?');
    const init = this.value ? getInitials(this.value) : '?';
    const el = document.getElementById('logoModalPreview');
    el.innerHTML = `<span style="color:${clr}">${init}</span>`;
    el.style.background = clr + '18';
  });
}
