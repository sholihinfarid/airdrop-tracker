/* =============================================
   detail.js — Project Detail Page Logic
   ============================================= */

let currentProject = null;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  if (!id) { window.location.href = 'index.html'; return; }

  currentProject = getById(id);
  if (!currentProject) { window.location.href = 'index.html'; return; }

  renderDetail();
});

// ── Color helpers ─────────────────────────────
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

function scorePct(s) { return Math.min(100, (s / 20000) * 100); }

function statusIcon(status) {
  return { Potential: '🤔', Confirmed: '✅', Claimed: '🎉', Missed: '❌' }[status] || '';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}

// ── Main render ───────────────────────────────
function renderDetail() {
  const p   = currentProject;
  const clr = getAccentColor(p.name);
  const sc  = Number(p.score) || 0;
  const logo = getLogo(p.id);

  document.title = p.name + ' — AirdropTrackr';

  // Hero logo
  const heroLogo = document.getElementById('heroLogo');
  if (logo) {
    heroLogo.innerHTML = `<img src="${logo}" alt="logo"><div class="hero-logo-change" id="logoChangeTrigger">📷</div>`;
  } else {
    heroLogo.innerHTML = `<span style="color:${clr}">${getInitials(p.name)}</span><div class="hero-logo-change" id="logoChangeTrigger">📷</div>`;
    heroLogo.style.background = clr + '18';
    heroLogo.style.border = `1px solid ${clr}33`;
  }
  document.getElementById('logoChangeTrigger')?.addEventListener('click', () => {
    document.getElementById('heroLogoInput').click();
  });

  // Hero info
  document.getElementById('heroTitle').textContent = p.name;

  // Badges
  document.getElementById('heroBadges').innerHTML = `
    <span class="badge ${p.status.toLowerCase()}">${statusIcon(p.status)} ${p.status}</span>
    <span class="badge task-${p.task.toLowerCase()}">${p.task}</span>
    <span class="badge" style="background:rgba(125,133,144,.1);color:var(--muted);border-color:var(--border)">${p.reward}</span>
  `;

  // Meta
  document.getElementById('heroMeta').innerHTML = `
    <div class="meta-item">
      <span class="meta-label">Biaya</span>
      <span class="meta-value" style="color:${p.cost > 0 ? 'var(--warn)' : 'var(--accent)'}">
        ${p.cost > 0 ? '$' + p.cost : 'Free'}
      </span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Waktu</span>
      <span class="meta-value">${p.timeMin || '—'} mnt</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Raise</span>
      <span class="meta-value" style="color:${clr}">
        ${p.raise && p.raise !== '—' ? '$' + p.raise : '—'}
      </span>
    </div>
    ${p.network ? `
    <div class="meta-item">
      <span class="meta-label">Network</span>
      <span class="meta-value">${p.network}</span>
    </div>` : ''}
  `;

  // Score
  const scClr = scoreColor(sc);
  document.getElementById('scoreDisplay').innerHTML = `
    <div class="score-big" style="color:${scClr}">${sc.toLocaleString()}</div>
    <div class="score-label">Moni Score</div>
    <div class="score-bar-lg">
      <div class="score-bar-lg-fill" style="width:${scorePct(sc)}%;background:${scClr}"></div>
    </div>
  `;

  // Status buttons
  renderStatusBtns();

  // Steps
  renderSteps();

  // Notes
  renderNotes();

  // Info rows
  document.getElementById('infoRows').innerHTML = `
    <div class="info-row"><span class="key">Dibuat</span><span class="val">${fmtDate(p.createdAt)}</span></div>
    <div class="info-row"><span class="key">Diupdate</span><span class="val">${fmtDate(p.updatedAt)}</span></div>
    <div class="info-row"><span class="key">Task Type</span><span class="val">${p.task}</span></div>
    <div class="info-row"><span class="key">Reward</span><span class="val">${p.reward}</span></div>
    <div class="info-row"><span class="key">Cost</span><span class="val">${p.cost > 0 ? '$' + p.cost : 'Free'}</span></div>
  `;

  // Links
  renderLinks();
}

// ── Status buttons ────────────────────────────
function renderStatusBtns() {
  const p = currentProject;
  const statuses = ['Potential', 'Confirmed', 'Claimed', 'Missed'];
  document.getElementById('statusBtns').innerHTML = statuses.map(s => `
    <button class="status-btn ${s === p.status ? 'active ' + s.toLowerCase() : ''}"
            onclick="changeStatus('${s}')">${statusIcon(s)} ${s}</button>
  `).join('');
}

function changeStatus(status) {
  currentProject.status = status;
  updateProject(currentProject.id, { status });
  renderDetail();
}

// ── Steps ─────────────────────────────────────
function renderSteps() {
  const p     = currentProject;
  const steps = p.steps || [];
  const done  = steps.filter(s => s.done).length;
  const total = steps.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const clr   = pct >= 100 ? 'var(--accent)' : pct >= 50 ? 'var(--accent2)' : 'var(--warn)';

  // progress
  const progEl = document.getElementById('stepsProgress');
  if (total > 0) {
    progEl.style.display = 'block';
    progEl.innerHTML = `
      <div class="progress-bg">
        <div class="progress-fill" style="width:${pct}%;background:${clr}"></div>
      </div>
      <div class="progress-label">
        <span>${done}/${total} selesai</span>
        <span style="color:${clr}">${pct}%</span>
      </div>`;
  } else {
    progEl.style.display = 'none';
  }

  // list
  const listEl = document.getElementById('stepsList');
  if (steps.length === 0) {
    listEl.innerHTML = `<div class="steps-empty">💡 Belum ada langkah pengerjaan.<br>Tambah lewat tombol Edit Project.</div>`;
    return;
  }
  listEl.innerHTML = steps.map((s, i) => `
    <div class="step-row ${s.done ? 'done' : ''}" id="step_${s.id}">
      <div class="step-circle" onclick="toggleStep('${s.id}')" title="Klik untuk tandai selesai">
        ${s.done ? '✓' : i + 1}
      </div>
      <div class="step-text">${escHtml(s.text)}</div>
    </div>`).join('');
}

function toggleStep(stepId) {
  const steps = currentProject.steps || [];
  const step  = steps.find(s => s.id === stepId);
  if (!step) return;
  step.done = !step.done;
  updateProject(currentProject.id, { steps });
  renderSteps();
}

// ── Notes ─────────────────────────────────────
function renderNotes() {
  const p = currentProject;
  const el = document.getElementById('notesContent');
  if (p.description) {
    el.innerHTML = `<p>${escHtml(p.description).replace(/\n/g, '<br>')}</p>`;
  } else {
    el.innerHTML = `<p class="empty">Belum ada deskripsi. Klik Edit Project untuk menambah.</p>`;
  }
}

// ── Links ─────────────────────────────────────
function renderLinks() {
  const p  = currentProject;
  const el = document.getElementById('linksSection');
  if (!p.link) {
    el.innerHTML = `<p style="font-size:13px;color:var(--muted)">Belum ada link yang disimpan.</p>`;
    return;
  }
  el.innerHTML = `
    <a href="${p.link}" target="_blank" class="link-item">
      🌐 <span>${p.link}</span>
    </a>`;
}

// ── Logo upload (from hero) ───────────────────
document.getElementById('heroLogoInput')?.addEventListener('change', async function(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const b64 = await fileToBase64(file);
    saveLogo(currentProject.id, b64);
    renderDetail();
  } catch (err) {
    alert('Gagal upload: ' + err.message);
  }
});

// ── Edit modal (opens index modal, redirect back) ──
// For simplicity: redirect to index with edit param
function editProject() {
  window.location.href = `index.html?edit=${currentProject.id}`;
}

// ── Util ──────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
