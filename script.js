const CATS = {
  app:  { label: 'App',  icon: 'app'  },
  tool: { label: 'Tool', icon: 'tool' },
  game: { label: 'Game', icon: 'game' },
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
      '<span class="contact-email">contact@example.com</span>',
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

const ICONS = {
  menu:     '<path d="M3 6h18M3 12h18M3 18h18"/>',
  back:     '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  check:    '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/>',
  open:     '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  search:   '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
  share:    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  globe:    '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  code:     '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  app:      '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/>',
  tool:     '<path d="M14.7 6.3a4 4 0 0 0 5 5l-8.4 8.4a2.8 2.8 0 0 1-4-4z"/>',
  game:     '<rect x="2" y="7" width="20" height="10" rx="5"/><path d="M7 12h4M9 10v4M15 13h.01M17.5 11h.01"/>',
  box:      '<rect x="3" y="3" width="18" height="18" rx="3"/>',
  arrow:    '<polyline points="9 18 15 12 9 6"/>',
};

function icon(name, cls = 'ico') {
  if (/^(https?:\/\/|\.?\/?[\w\-\/.]+\.(svg|png|jpe?g|webp|gif)$)/i.test(name || '')) {
    return `<img class="icon-img" src="${name}" alt="">`;
  }
  const body = ICONS[name] || ICONS.box;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

const $ = (sel) => document.querySelector(sel);

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ── Menu ── */
function setupMenu() {
  const btn     = $('#menu-btn');
  const menu    = $('#side-menu');
  const overlay = $('#overlay');
  if (!btn || !menu) return;

  const open  = () => { menu.classList.add('open');    overlay && overlay.classList.add('show'); };
  const close = () => { menu.classList.remove('open'); overlay && overlay.classList.remove('show'); };

  btn.addEventListener('click', open);
  overlay && overlay.addEventListener('click', close);
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
}

/* ── Search scoring ── */
function scoreApp(app, tokens) {
  const name     = app.name.toLowerCase();
  const keywords = (app.keywords || []).join(' ').toLowerCase();
  const desc     = `${app.short || ''} ${app.description || ''}`.toLowerCase();
  const cat      = (CATS[app.category]?.label || '').toLowerCase();
  let score = 0, matchedAll = true;
  for (const t of tokens) {
    let hit = false;
    if (name.includes(t))     { score += 5; hit = true; }
    if (keywords.includes(t)) { score += 3; hit = true; }
    if (cat.includes(t))      { score += 2; hit = true; }
    if (desc.includes(t))     { score += 1; hit = true; }
    if (!hit) matchedAll = false;
  }
  if (matchedAll && score > 0) score += 4;
  return score;
}

function filterApps(apps, query, cat, view) {
  let list = apps;
  if (cat)  list = list.filter((a) => a.category === cat);
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

/* ── App list item (vertical list style) ── */
function appListItem(app) {
  const ratingHTML = app.rating
    ? `<span class="stars"><span class="star-val">★</span> ${app.rating} (${app.reviewCount || 0})</span>`
    : '';
  const ossHTML = app.verified
    ? `<span class="badge-os">${icon('check')} Open Source</span>`
    : '';
  return `
    <a class="app-item" href="view.html?id=${encodeURIComponent(app.id)}">
      <div class="app-icon">${icon(app.icon || app.category)}</div>
      <div class="app-info">
        <div class="app-name">${esc(app.name)}</div>
        <div class="app-desc">${esc(app.short || '')}</div>
        <div class="app-meta">${ratingHTML}${ossHTML}</div>
      </div>
      <span class="app-arrow">${icon('arrow')}</span>
    </a>`;
}

/* ── Home page ── */
function renderHome(apps, params) {
  const search = $('#search');
  const cat    = params.get('cat');
  const view   = params.get('view');
  const list   = $('#app-list');
  const title  = $('#section-title');

  // Mark active chip
  document.querySelectorAll('.chip').forEach((chip) => {
    const chipCat  = chip.dataset.cat;
    const chipView = chip.dataset.view;
    const active =
      (chipCat === '' && !cat && !view) ||
      (chipCat  && chipCat  === cat)   ||
      (chipView && chipView === view);
    chip.classList.toggle('active', !!active);
  });

  search.value = params.get('q') || '';

  const render = () => {
    const query = search.value.trim();

    if (query) {
      title.textContent = `Results for "${query}"`;
      title.hidden = false;
    } else if (view === 'foryou') {
      title.textContent = 'Signature For You';
      title.hidden = false;
    } else if (cat) {
      title.textContent = CATS[cat]?.label || 'Browse';
      title.hidden = false;
    } else {
      title.hidden = true;
    }

    const filtered = filterApps(apps, query, cat, view);
    list.innerHTML = filtered.length
      ? filtered.map(appListItem).join('')
      : '<p class="empty">No results found. Try a different word.</p>';
  };

  search.addEventListener('input', render);
  render();

  // Bottom nav search shortcut
  const searchNav = $('#bnav-search');
  if (searchNav) {
    searchNav.addEventListener('click', (e) => {
      e.preventDefault();
      search.focus();
      search.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

/* ── Detail page ── */
function renderView(apps, params) {
  const box = $('#detail');
  const app = apps.find((a) => a.id === params.get('id'));

  if (!app) {
    box.innerHTML = '<p class="empty">App not found. <a href="index.html">Back to store</a></p>';
    return;
  }

  document.title = `${app.name} — STD App Store`;

  /* Stats row */
  const statsHTML = app.rating ? `
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-value"><span class="stat-star">★</span> ${app.rating}</div>
        <div class="stat-label">${(app.reviewCount || 0).toLocaleString()} reviews</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${esc(app.downloads || 'Free')}</div>
        <div class="stat-label">Downloads</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" style="font-size:13px">${esc(app.updated || 'Recent')}</div>
        <div class="stat-label">Last Updated</div>
      </div>
    </div>` : '';

  /* Features carousel */
  const features = app.features || [];
  const featuresHTML = features.length ? `
    <div class="feature-section">
      <div class="sec-head">Features</div>
      <div class="feature-scroll">
        ${features.map((f) => `
          <div class="feat-card">
            ${icon(app.category)}
            <div class="feat-title">${esc(f.title)}</div>
            <div class="feat-sub">${esc(f.sub || '')}</div>
          </div>`).join('')}
      </div>
    </div>` : '';

  /* Tags */
  const tagList    = app.tags || [];
  const tagsHTML   = tagList.length
    ? `<div class="tags-wrap">${tagList.map((t) => `<span class="tag-chip">${esc(t)}</span>`).join('')}</div>`
    : '';

  /* Ratings bar chart */
  const ratingHTML = app.rating ? `
    <div class="ratings-section">
      <div class="ratings-header">
        <div class="sec-head" style="margin:0">Ratings &amp; Reviews</div>
        <span class="see-all">See all</span>
      </div>
      <div class="rating-big">
        <div>
          <div class="rating-num">${app.rating}</div>
          <div class="rating-stars">★★★★★</div>
          <div class="rating-count">${(app.reviewCount || 0).toLocaleString()} reviews</div>
        </div>
        <div class="rating-bars">
          ${[5,4,3,2,1].map((n) => {
            const pct = n===5?80 : n===4?12 : n===3?5 : n===2?2 : 1;
            return `<div class="bar-row">
              <span>${n}★</span>
              <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>` : '';

  box.innerHTML = `
    <div class="detail-hero">
      <div class="detail-icon">${icon(app.icon || app.category)}</div>
      <div class="detail-hero-info">
        <div class="detail-name">${esc(app.name)}</div>
        <div class="detail-version">${app.version ? esc(app.version) + (app.size ? '&nbsp;&nbsp;|&nbsp;&nbsp;' + esc(app.size) : '') : ''}</div>
        <div class="detail-badges">
          ${app.verified ? `<span class="dbadge green">${icon('check')} Open Source</span>` : ''}
          <span class="dbadge gray">Free</span>
        </div>
        <div class="detail-tagline">${esc(app.tagline || '')}</div>
      </div>
    </div>

    ${statsHTML}

    <div class="install-wrap">
      <button class="btn-install" id="open-btn">
        ${icon('open')} Open App
      </button>
      <button class="btn-how-text" id="how-btn">How to Add to Home Screen ▾</button>
      <div id="how" class="how-panel" hidden>${HOW_TO_HTML}</div>
    </div>

    ${featuresHTML}

    <div class="about-section">
      <div class="sec-head">About</div>
      <p class="about-text">${esc(app.description || app.short || '')}</p>
      ${tagsHTML}
    </div>

    <div class="info-table-section">
      ${app.developer    ? `<div class="info-row"><div class="info-label">Developer</div><div class="info-value">${esc(app.developer)}</div></div>` : ''}
      ${app.source       ? `<div class="info-row"><div class="info-label">Source Code</div><div class="info-value"><a href="${esc(app.source)}" target="_blank" rel="noopener">${esc(app.source.replace('https://',''))}</a></div></div>` : ''}
      ${app.website      ? `<div class="info-row"><div class="info-label">Website</div><div class="info-value"><a href="${esc(app.website)}" target="_blank" rel="noopener">${esc(app.website.replace(/^https?:\/\//,''))}</a></div></div>` : ''}
      ${app.license      ? `<div class="info-row"><div class="info-label">License</div><div class="info-value">${esc(app.license)}</div></div>` : ''}
      <div class="info-row"><div class="info-label">Category</div><div class="info-value">${esc(CATS[app.category]?.label || app.category)}</div></div>
      ${app.compatibility ? `<div class="info-row"><div class="info-label">Compatibility</div><div class="info-value">${esc(app.compatibility)}</div></div>` : ''}
    </div>

    ${ratingHTML}
  `;

  $('#open-btn').addEventListener('click', () => { window.location.href = app.path; });

  const how    = $('#how');
  const howBtn = $('#how-btn');
  howBtn.addEventListener('click', () => {
    how.hidden = !how.hidden;
    howBtn.textContent = how.hidden
      ? 'How to Add to Home Screen ▾'
      : 'How to Add to Home Screen ▴';
    if (!how.hidden) how.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ── Info pages ── */
function renderInfo(params) {
  const key  = INFO[params.get('p')] ? params.get('p') : 'about';
  const data = INFO[key];
  document.title = `${data.title} — STD App Store`;
  $('#info').innerHTML = `
    <h1>${esc(data.title)}</h1>
    ${data.body.map((p) => `<p>${p.includes('<span') ? p : esc(p)}</p>`).join('')}
  `;
}

/* ── Boot ── */
(async function init() {
  setupMenu();
  const page   = document.body.dataset.page;
  const params = new URLSearchParams(location.search);

  if (page === 'info') { renderInfo(params); return; }

  let apps = [];
  try {
    const res  = await fetch('apps.json', { cache: 'no-cache' });
    const data = await res.json();
    apps = data.apps || [];
  } catch (err) {
    console.error('Could not load apps.json', err);
  }

  if (page === 'home') renderHome(apps, params);
  if (page === 'view') renderView(apps, params);
})();
