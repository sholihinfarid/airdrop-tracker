/* =============================================
   data.js — Data Layer (localStorage)
   ============================================= */

const DATA_KEY   = 'airdrop_projects_v2';
const LOGO_KEY   = 'airdrop_logos_v2';  // stored separately (base64 can be large)

// ── Helpers ──────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Load / Save ───────────────────────────────
function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveProjects(list) {
  localStorage.setItem(DATA_KEY, JSON.stringify(list));
}

function loadLogos() {
  try {
    return JSON.parse(localStorage.getItem(LOGO_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveLogo(id, base64) {
  const logos = loadLogos();
  logos[id] = base64;
  localStorage.setItem(LOGO_KEY, JSON.stringify(logos));
}

function getLogo(id) {
  return loadLogos()[id] || null;
}

function deleteLogo(id) {
  const logos = loadLogos();
  delete logos[id];
  localStorage.setItem(LOGO_KEY, JSON.stringify(logos));
}

// ── CRUD ──────────────────────────────────────
function getAll() {
  return loadProjects();
}

function getById(id) {
  return loadProjects().find(p => p.id === id) || null;
}

function addProject(data) {
  const list = loadProjects();
  const project = {
    id:          uid(),
    name:        data.name        || 'Unnamed Project',
    task:        data.task        || 'Other',
    status:      data.status      || 'Potential',
    reward:      data.reward      || 'Airdrop',
    cost:        Number(data.cost)  || 0,
    raise:       data.raise       || '—',
    score:       Number(data.score) || 0,
    network:     data.network     || '',
    timeMin:     Number(data.timeMin) || 0,
    link:        data.link        || '',
    description: data.description || '',
    steps:       data.steps       || [],       // array of { id, text, done }
    tags:        data.tags        || [],
    fav:         false,
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  };
  list.unshift(project);
  saveProjects(list);
  return project;
}

function updateProject(id, data) {
  const list = loadProjects();
  const idx  = list.findIndex(p => p.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data, id, updatedAt: new Date().toISOString() };
  saveProjects(list);
  return list[idx];
}

function deleteProject(id) {
  const list = loadProjects().filter(p => p.id !== id);
  saveProjects(list);
  deleteLogo(id);
}

function toggleFav(id) {
  const p = getById(id);
  if (!p) return;
  updateProject(id, { fav: !p.fav });
}

// ── File → Base64 ────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

// ── Demo seed (first run) ─────────────────────
function seedIfEmpty() {
  if (loadProjects().length > 0) return;

  const demo = [
    {
      name: 'Perle (Prev. Kiva Ai)',
      task: 'Social',
      status: 'Potential',
      reward: 'Airdrop',
      cost: 0,
      raise: '17.50M',
      score: 797,
      network: 'ERC',
      timeMin: 24,
      link: 'https://kiva.ai',
      description: 'Perle adalah project AI yang sebelumnya dikenal sebagai Kiva Ai. Mereka memiliki raise $17.5M dari beberapa investor terkemuka.',
      steps: [
        { id: uid(), text: 'Follow akun Twitter @PerleAI', done: false },
        { id: uid(), text: 'Join Discord server official', done: false },
        { id: uid(), text: 'Retweet pinned tweet', done: false },
        { id: uid(), text: 'Isi form waitlist di website', done: false },
      ],
    },
    {
      name: 'Robinhood Chain',
      task: 'Testnet',
      status: 'Potential',
      reward: 'Airdrop',
      cost: 0,
      raise: '—',
      score: 15013,
      network: '',
      timeMin: 13,
      link: '',
      description: 'Robinhood Chain adalah blockchain baru dari platform trading Robinhood. Testnet tersedia dan berpotensi airdrop bagi early users.',
      steps: [
        { id: uid(), text: 'Kunjungi testnet.robinhoodchain.com', done: false },
        { id: uid(), text: 'Tambahkan network ke MetaMask', done: false },
        { id: uid(), text: 'Claim faucet testnet token', done: false },
        { id: uid(), text: 'Lakukan minimal 5 transaksi', done: false },
        { id: uid(), text: 'Berinteraksi dengan semua dApps yang tersedia', done: false },
      ],
    },
    {
      name: 'Dreamcash',
      task: 'Trading',
      status: 'Confirmed',
      reward: 'Airdrop',
      cost: 40,
      raise: '—',
      score: 2983,
      network: 'USDT',
      timeMin: 10,
      link: '',
      description: 'Dreamcash adalah platform trading dengan airdrop yang sudah confirmed. Butuh modal $40 USDT untuk mulai trading dan eligible mendapat reward.',
      steps: [
        { id: uid(), text: 'Daftar akun di dreamcash.io', done: false },
        { id: uid(), text: 'Deposit minimal $40 USDT', done: false },
        { id: uid(), text: 'Lakukan trading minimal volume $200', done: false },
        { id: uid(), text: 'Klaim reward di halaman airdrop', done: false },
      ],
    },
  ];

  demo.forEach(d => addProject(d));
}

// ── Stats ─────────────────────────────────────
function getStats() {
  const list = loadProjects();
  return {
    total:     list.length,
    potential: list.filter(p => p.status === 'Potential').length,
    confirmed: list.filter(p => p.status === 'Confirmed').length,
    claimed:   list.filter(p => p.status === 'Claimed').length,
    missed:    list.filter(p => p.status === 'Missed').length,
    totalCost: list.reduce((s, p) => s + (Number(p.cost) || 0), 0),
  };
}
