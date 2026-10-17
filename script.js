const CATS = {
  app:  { label: 'App',  icon: '📱' },
  tool: { label: 'Tool', icon: '🛠️' },
  game: { label: 'Game', icon: '🎮' },
};

const INFO = {
  about: {
    title: 'About',
    body: [
      'STD App Store is a free directory of web apps, tools and games. Every app opens right inside your browser, and you can add it to your phone or computer whenever you like.',
      'Open source developers can request a listing. Each project is checked before it is published.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'The store does not ask you to create an account and does not collect personal information.',
      'Each listed app is a separate project. Its developer decides what data it stores or sends, so please read the app before using it.',
    ],
  },
  contact: {
    title: 'Contact Us',
    body: [
      'For listing requests, bug reports or questions, write to us at:',
      '<span class="contact">contact@example.com</span>',
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    body: [
      'Apps in this store are provided by their developers. We verify them on a best-effort basis, but we are not responsible for any loss or damage caused by using them.',
      'Listing an app does not mean it is endorsed by or affiliated with the developer, unless stated otherwise.',
    ],
  },
};

const HOW_TO_HTML = `
  <h3>Android (Chrome)</h3>
  <ol>
    <li>Open this app in Chrome.</li>
    <li>Tap the three-dot menu (⋮) at the top right.</li>
    <li>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
    <li>Tap <strong>Add</strong> or <strong>Install</strong>. The icon appears on your home screen.</li>
  </ol>
  <h3>iPhone (Safari)</h3>
  <ol>
    <li>Open this app in Safari.</li>
    <li>Tap the Share button (square with an arrow).</li>
    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
    <li>Tap <strong>Add</strong>.</li>
  </ol>
  <h3>Computer (Chrome or Edge)</h3>
  <ol>
    <li>Click the install icon at the right side of the address bar, or open the ⋮ menu.</li>
    <li>Click <strong>Install</strong>.</li>
  </ol>
`;

const $ = (sel) => document.querySelector(sel);

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ---------- Menu ---------- */
function setupMenu() {
  const btn = $('#menu-btn');
  const menu = $('#side-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => menu.classList.toggle('open'));
  menu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => menu.classList.remove('open'))
  );
}

/* ---------- Search and ranking ---------- */
function scoreApp(app, tokens) {
  const name = app.name.toLowerCase();
  const keywords = (app.keywords || []).join(' ').toLowerCase();
  const desc = `${app.short || ''} ${app.description || ''}`.toLowerCase();
  const cat = (CATS[app.category]?.label || '').toLowerCase();

  let score = 0;
  let matchedAll = true;

  for (const t of tokens) {
    let hit = false;
    if (name.includes(t))     { score += 5; hit = true; }
    if (keywords.includes(t)) { score += 3; hit = true; }
    if (cat.includes(t))      { score += 2; hit = true; }
    if (desc.includes(t))     { score += 1; hit = true; }
    if (!hit) matchedAll = false;
  }

  // Apps that match every word rank above partial matches
  if (matchedAll && score > 0) score += 4;
  return score;
}

function filterApps(apps, query, cat, view) {
  let list = apps;
  if (cat) list = list.filter((a) => a.category === cat);
  if (view === 'foryou') list = list.filter((a) => a.featured);
  if (!query) return list;

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return list
    .map((app) => ({ app, score: scoreApp(app, tokens) }))
    .filter((x) => x.score > 0)
    .sort((x, y) =>
      y.score - x.score ||
      Number(!!y.app.verified) - Number(!!x.app.verified) ||
      x.app.name.localeCompare(y.app.name)
    )
    .map((x) => x.app);
}

/* ---------- Cards ---------- */
function appCard(app) {
  const badge = app.verified ? '<span class="badge">✔ Verified</span>' : '';
  return `
    <a class="card" href="view.html?id=${encodeURIComponent(app.id)}">
      <div class="icon">${esc(app.icon || '📦')}</div>
      <div>
        <h3>${esc(app.name)} ${badge}</h3>
        <p class="by">by ${esc(app.developer || 'Unknown developer')}</p>
        <p>${esc(app.short || '')}</p>
        <span class="tag">${esc(CATS[app.category]?.label || app.category)}</span>
      </div>
    </a>`;
}

/* ---------- Home page ---------- */
function renderHome(apps, params) {
  const search = $('#search');
  const cat = params.get('cat');
  const view = params.get('view');
  const categoriesEl = $('#categories');
  const featuredWrap = $('#featured-wrap');
  const featuredEl = $('#featured');
  const resultsWrap = $('#results-wrap');
  const grid = $('#grid');
  const title = $('#section-title');

  search.value = params.get('q') || '';

  categoriesEl.innerHTML = Object.entries(CATS).map(([key, c]) => {
    const count = apps.filter((a) => a.category === key).length;
    return `
      <a class="cat-card" href="index.html?cat=${key}">
        <span>${c.icon}</span>
        <strong>${c.label}</strong>
        <small>${count} ${count === 1 ? 'item' : 'items'}</small>
      </a>`;
  }).join('');

  featuredEl.innerHTML = apps.filter((a) => a.featured).map(appCard).join('');

  const render = () => {
    const query = search.value.trim();
    const browsing = Boolean(query || cat || view);

    categoriesEl.hidden = browsing;
    featuredWrap.hidden = browsing || !featuredEl.innerHTML.trim();
    resultsWrap.hidden = !browsing;

    if (browsing) {
      if (query) title.textContent = `Results for "${query}"`;
      else if (view === 'foryou') title.textContent = 'Signature For You';
      else if (cat) title.textContent = CATS[cat]?.label || 'Browse';
      title.hidden = false;

      const list = filterApps(apps, query, cat, view);
      grid.innerHTML = list.length
        ? list.map(appCard).join('')
        : '<p class="empty">No results found. Try a different word.</p>';
    } else {
      title.hidden = true;
    }
  };

  search.addEventListener('input', render);
  render();
}

/* ---------- Detail page ---------- */
function renderView(apps, params) {
  const box = $('#detail');
  const app = apps.find((a) => a.id === params.get('id'));

  if (!app) {
    box.innerHTML = '<p class="empty">This app was not found. <a href="index.html">Back to the store</a></p>';
    return;
  }

  document.title = `${app.name} - STD App Store`;
  const badge = app.verified ? '<span class="badge">✔ Verified</span>' : '';

  box.innerHTML = `
    <div class="detail-head">
      <div class="icon big">${esc(app.icon || '📦')}</div>
      <div>
        <h1>${esc(app.name)} ${badge}</h1>
        <p class="meta">by ${esc(app.developer || 'Unknown developer')} · ${esc(CATS[app.category]?.label || '')}</p>
        <p>${esc(app.short || '')}</p>
      </div>
    </div>

    <div class="actions">
      <button class="btn primary" id="open-btn">Open</button>
      <button class="btn" id="how-btn">How to Download</button>
    </div>

    <div id="how" class="panel" hidden>
      <h2>How to download this app</h2>
      <p>The app runs in your browser. To keep it on your phone or computer, add it to your home screen:</p>
      ${HOW_TO_HTML}
    </div>

    <section class="about-app">
      <h2>About this app</h2>
      <p>${esc(app.description || '')}</p>
      ${app.source ? `<p>Source: <a href="${esc(app.source)}" target="_blank" rel="noopener">${esc(app.source)}</a></p>` : ''}
    </section>
  `;

  const how = $('#how');

  $('#open-btn').addEventListener('click', () => {
    window.location.href = app.path;
  });

  $('#how-btn').addEventListener('click', () => {
    how.hidden = !how.hidden;
    if (!how.hidden) how.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ---------- Info pages ---------- */
function renderInfo(params) {
  const key = INFO[params.get('p')] ? params.get('p') : 'about';
  const data = INFO[key];
  document.title = `${data.title} - STD App Store`;
  $('#info').innerHTML = `
    <h1>${esc(data.title)}</h1>
    ${data.body.map((p) => `<p>${p.includes('<span') ? p : esc(p)}</p>`).join('')}
  `;
}

/* ---------- Boot ---------- */
(async function init() {
  setupMenu();

  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);

  if (page === 'info') {
    renderInfo(params);
    return;
  }

  let apps = [];
  try {
    const res = await fetch('apps.json', { cache: 'no-cache' });
    const data = await res.json();
    apps = data.apps || [];
  } catch (err) {
    console.error('Could not load apps.json', err);
  }

  if (page === 'home') renderHome(apps, params);
  if (page === 'view') renderView(apps, params);
})();
