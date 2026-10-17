/* ═══════════════════════════════════════════════
   Firebase (ریویو سسٹم) — پروجیکٹ: steptudeen-review
   ═══════════════════════════════════════════════ */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBq0NdPA2pC3C-qd4RVuc89VP8c28Qu2PA",
  authDomain: "steptudeen-review.firebaseapp.com",
  projectId: "steptudeen-review",
  storageBucket: "steptudeen-review.firebasestorage.app",
  messagingSenderId: "764770905404",
  appId: "1:764770905404:web:11a4be8da48ce471b58239"
};
const FB_VER = '10.12.2';
// پرانے ریویو جن میں appId نہیں ہے وہ اس ایپ کے مانے جائیں گے
const LEGACY_APP_ID = 'steptudeen';

let _fb = null;
function fb() {
  if (!_fb) {
    _fb = (async () => {
      const [{ initializeApp }, fs] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore.js`),
      ]);
      const app = initializeApp(FIREBASE_CONFIG);
      return { db: fs.getFirestore(app), ...fs };
    })().catch((e) => { _fb = null; throw e; });
  }
  return _fb;
}

function reviewTime(d) {
  if (d?.createdAt?.toDate) return d.createdAt.toDate().getTime();
  if (d?.createdAt?.seconds) return d.createdAt.seconds * 1000;
  if (typeof d?.createdAt === 'number') return d.createdAt;
  return 0;
}

function isApproved(v) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

let _reviews = null;
function loadReviews(force) {
  if (!_reviews || force) {
    _reviews = (async () => {
      const { db, collection, query, where, getDocs } = await fb();
      const snap = await getDocs(query(collection(db, 'reviews'), where('approved', '==', true)));
      const out = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (isApproved(d.approved)) out.push({ ...d, appId: d.appId || LEGACY_APP_ID });
      });
      out.sort((a, b) => reviewTime(b) - reviewTime(a));
      return out;
    })().catch((e) => { _reviews = null; throw e; });
  }
  return _reviews;
}

function statsFor(list, appId) {
  const mine = list.filter((r) => r.appId === appId);
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  mine.forEach((r) => {
    const n = Math.min(5, Math.max(1, Number(r.rating) || 1));
    counts[n]++; total += n;
  });
  const count = mine.length;
  return { count, avgNum: count ? total / count : 0, avg: count ? (total / count).toFixed(1) : '—', counts, reviews: mine };
}

let RATING_STATS = {};   // appId -> {count, avg}

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
  gear:     '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
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

  // مینیو کے سب سے اوپر عنوان اور گراری (ایک بار بنتا ہے)
  if (!menu.querySelector('.menu-head')) {
    const head = document.createElement('div');
    head.className = 'menu-head';
    head.innerHTML = `${icon('gear')}<span>Menu</span>`;
    menu.prepend(head);
  }

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
  const st = RATING_STATS[app.id];
  const ratingHTML = st && st.count
    ? `<span class="stars"><span class="star-val">★</span> ${st.avg} (${st.count})</span>`
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
    list.innerHTML = filtered.map(appListItem).join('');

    // index.html میں ہاتھ سے پیسٹ کیے گئے کارڈ
    const q = query.toLowerCase();
    const manual = [...document.querySelectorAll('#manual-apps .store-card')].filter((c) =>
      (!cat  || c.dataset.category === cat) &&
      (view !== 'foryou' || c.dataset.featured === 'true') &&
      (!q || c.textContent.toLowerCase().includes(q))
    );
    manual.forEach((c) => list.appendChild(c.cloneNode(true)));

    if (!filtered.length && !manual.length) {
      list.innerHTML = '<p class="empty">No results found. Try a different word.</p>';
    }
  };

  search.addEventListener('input', render);
  render();

  // اصل ریٹنگ Firebase سے لا کر کارڈز میں دکھائیں
  loadReviews().then((all) => {
    RATING_STATS = {};
    apps.forEach((a) => { const st = statsFor(all, a.id); RATING_STATS[a.id] = { count: st.count, avg: st.avg }; });
    render();
  }).catch((e) => console.warn('Ratings could not load', e));

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

/* ── Detail: stats + reviews ── */
function starsText(n) {
  const r = Math.round(n);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

function statsHTML(app, st) {
  const items = [];
  const label = !st ? 'Loading…' : st.count ? `${st.count.toLocaleString()} review${st.count === 1 ? '' : 's'}` : 'No reviews yet';
  items.push(`
    <div class="stat-item">
      <div class="stat-value"><span class="stat-star">★</span> ${st && st.count ? st.avg : '—'}</div>
      <div class="stat-label">${label}</div>
    </div>`);
  if (app.downloads) {
    items.push(`
    <div class="stat-item">
      <div class="stat-value">${esc(app.downloads)}</div>
      <div class="stat-label">Downloads</div>
    </div>`);
  }
  items.push(`
    <div class="stat-item">
      <div class="stat-value" style="font-size:13px">${esc(app.updated || 'Recent')}</div>
      <div class="stat-label">Last Updated</div>
    </div>`);
  return `<div class="stats-row">${items.join('')}</div>`;
}

function reviewsSkeleton() {
  return `
    <div class="ratings-section" id="reviews">
      <div class="ratings-header">
        <div class="sec-head" style="margin:0">Ratings &amp; Reviews</div>
        <a class="see-all" href="#write-review">Write a review</a>
      </div>
      <div id="rv-summary"><p class="rv-note">Loading reviews…</p></div>
      <div id="rv-list"></div>
      <div id="rv-more" hidden><button type="button" class="rv-more-btn" id="rv-more-btn"></button></div>
    </div>

    <div class="ratings-section" id="write-review">
      <div class="sec-head">Write a review</div>
      <p class="rv-note" style="margin-bottom:12px">Honest feedback helps everyone. Your review appears after a short approval.</p>
      <form id="rv-form" novalidate>
        <div class="rv-stars" id="rv-stars" role="radiogroup" aria-label="Rating">
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-val="${n}" aria-label="${n} star${n === 1 ? '' : 's'}">★</button>`).join('')}
        </div>
        <input class="rv-field" id="rv-name" type="text" maxlength="60" placeholder="Your name" autocomplete="name">
        <textarea class="rv-field" id="rv-comment" maxlength="500" placeholder="Share your experience…"></textarea>
        <button class="rv-submit" id="rv-submit" type="submit">Submit Review</button>
        <div class="rv-msg" id="rv-msg" hidden></div>
      </form>
    </div>`;
}

function reviewCard(r) {
  const n = Math.min(5, Math.max(1, Number(r.rating) || 1));
  const ts = reviewTime(r);
  const date = ts ? new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const initial = (r.name || '?').trim().charAt(0).toUpperCase();
  return `
    <div class="rv-card">
      <div class="rv-top">
        <span class="rv-author"><span class="rv-avatar">${esc(initial)}</span>${esc(r.name)}</span>
        <span class="rv-card-stars">${starsText(n)}</span>
      </div>
      ${date ? `<div class="rv-date">${esc(date)}</div>` : ''}
      <div class="rv-comment">${esc(r.comment)}</div>
    </div>`;
}

function setupReviews(app) {
  const PREVIEW = 3;
  let showAll = false;
  let st = null;

  const paint = () => {
    $('#stats-root').innerHTML = statsHTML(app, st);
    const list = $('#rv-list');
    const more = $('#rv-more');
    if (!st.count) {
      $('#rv-summary').innerHTML = '<p class="rv-note">No reviews yet. Be the first to review this app.</p>';
      list.innerHTML = '';
      more.hidden = true;
      return;
    }
    $('#rv-summary').innerHTML = `
      <div class="rating-big">
        <div>
          <div class="rating-num">${st.avg}</div>
          <div class="rating-stars">${starsText(st.avgNum)}</div>
          <div class="rating-count">${st.count.toLocaleString()} review${st.count === 1 ? '' : 's'}</div>
        </div>
        <div class="rating-bars">
          ${[5, 4, 3, 2, 1].map((n) => `<div class="bar-row"><span>${n}★</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(st.counts[n] / st.count * 100)}%"></div></div></div>`).join('')}
        </div>
      </div>`;
    const shown = showAll ? st.reviews : st.reviews.slice(0, PREVIEW);
    list.innerHTML = shown.map(reviewCard).join('');
    if (st.reviews.length > PREVIEW) {
      more.hidden = false;
      $('#rv-more-btn').textContent = showAll ? 'Show less' : `Read more · ${st.reviews.length - PREVIEW} more review${st.reviews.length - PREVIEW === 1 ? '' : 's'}`;
    } else {
      more.hidden = true;
    }
  };

  const load = () => {
    $('#rv-summary').innerHTML = '<p class="rv-note">Loading reviews…</p>';
    loadReviews(true).then((all) => { st = statsFor(all, app.id); paint(); }).catch((e) => {
      console.error('Reviews failed to load', e);
      $('#stats-root').innerHTML = statsHTML(app, { count: 0, avg: '—' }).replace('No reviews yet', 'Unavailable');
      $('#rv-summary').innerHTML = '<p class="rv-note">Could not load reviews. Check your internet connection. <button type="button" class="rv-retry" id="rv-retry">Try again</button></p>';
      $('#rv-retry').addEventListener('click', load);
    });
  };
  load();

  $('#rv-more-btn').addEventListener('click', () => { showAll = !showAll; paint(); });

  /* stars */
  let selected = 0;
  const starBtns = [...document.querySelectorAll('#rv-stars button')];
  const paintStars = (n) => starBtns.forEach((b) => b.classList.toggle('on', +b.dataset.val <= n));
  starBtns.forEach((b) => {
    b.addEventListener('mouseover', () => paintStars(+b.dataset.val));
    b.addEventListener('mouseout', () => paintStars(selected));
    b.addEventListener('click', () => { selected = +b.dataset.val; paintStars(selected); });
  });

  /* submit */
  const msg = $('#rv-msg');
  const show = (type, text) => { msg.className = 'rv-msg ' + type; msg.textContent = text; msg.hidden = false; };
  $('#rv-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.hidden = true;
    const name = $('#rv-name').value.trim();
    const comment = $('#rv-comment').value.trim();
    if (!selected) return show('error', 'Please select at least 1 star.');
    if (!name) return show('error', 'Name is required.');
    if (!comment) return show('error', 'Please share a short comment.');

    let last = 0;
    try { last = Number(localStorage.getItem('rv-last') || 0); } catch (_) {}
    if (Date.now() - last < 60000) return show('error', 'Please wait a minute before sending another review.');

    const btn = $('#rv-submit');
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      const { db, collection, addDoc, serverTimestamp } = await fb();
      await addDoc(collection(db, 'reviews'), {
        appId: app.id,
        appName: app.name,
        name, rating: selected, comment,
        approved: false,
        createdAt: serverTimestamp(),
      });
      try { localStorage.setItem('rv-last', String(Date.now())); } catch (_) {}
      show('success', 'Thank you! Your review has been received and will appear after approval.');
      $('#rv-form').reset();
      selected = 0; paintStars(0);
    } catch (err) {
      console.error(err);
      show('error', 'Something went wrong. Please try again.');
    } finally {
      btn.disabled = false; btn.textContent = 'Submit Review';
    }
  });
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

    <div id="stats-root">${statsHTML(app, null)}</div>

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

    ${reviewsSkeleton()}
  `;

  $('#open-btn').addEventListener('click', () => {
    if (!navigator.onLine) { netToast('No internet connection'); return; }
    window.location.href = app.path;
  });

  setupReviews(app);

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

/* ── PWA + offline ── */
function netToast(text) {
  let t = document.getElementById('net-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'net-toast';
    t.className = 'net-toast';
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(netToast._t);
  netToast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

function setupPWA() {
  const head = document.head;
  if (!head.querySelector('link[rel="manifest"]')) {
    const l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.webmanifest'; head.appendChild(l);
  }
  if (!head.querySelector('meta[name="theme-color"]')) {
    const m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#ffffff'; head.appendChild(m);
  }
  if (!head.querySelector('link[rel="apple-touch-icon"]')) {
    const l = document.createElement('link'); l.rel = 'apple-touch-icon'; l.href = 'icons/icon-192.png'; head.appendChild(l);
  }
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker failed', e));
    });
  }
}

function netErrorHTML(kind) {
  const offline = kind === 'offline';
  return `
    <div class="net-error">
      <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M1 1l22 22M16.7 11.1A11 11 0 0 1 22 14M5 12.9a11 11 0 0 1 5.2-2.7M8.5 16.4a6 6 0 0 1 7 0M12 20h.01M2 8.8a15 15 0 0 1 4.2-2.5M10.7 5.1A15 15 0 0 1 22 8.8"/>
      </svg>
      <h3>${offline ? 'No internet connection' : 'Something went wrong'}</h3>
      <p>${offline ? 'Please check your internet connection and try again.' : 'The store could not load right now. Please try again.'}</p>
      <button type="button" class="net-retry">Try again</button>
    </div>`;
}

function showNetError(box, kind) {
  box.innerHTML = netErrorHTML(kind);
  const btn = box.querySelector('.net-retry');
  btn.addEventListener('click', () => {
    if (!navigator.onLine) { netToast('Still no internet connection'); return; }
    location.reload();
  });
}

/* ── Boot ── */
(async function init() {
  setupMenu();
  setupPWA();
  const page   = document.body.dataset.page;
  const params = new URLSearchParams(location.search);

  // اوپن ایپ بٹن (index.html میں پیسٹ کیے گئے کارڈ) — انٹرنیٹ نہ ہو تو ایرر دکھائیں
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a.open-btn');
    if (a && !navigator.onLine) { e.preventDefault(); netToast('No internet connection'); }
  });
  window.addEventListener('offline', () => netToast('You are offline'));

  if (page === 'info') { renderInfo(params); return; }

  let apps = [];
  let loadError = null;
  try {
    const res = await fetch('apps.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    apps = data.apps || [];
  } catch (err) {
    console.error('Could not load apps.json', err);
    loadError = err instanceof TypeError ? 'offline' : 'server';   // TypeError = نیٹ ورک نہیں
  }

  if (loadError) {
    const box = page === 'home' ? $('#app-list') : $('#detail');
    const title = $('#section-title');
    if (title) title.hidden = true;
    if (box) showNetError(box, loadError);
    // انٹرنیٹ واپس آتے ہی خود دوبارہ لوڈ
    window.addEventListener('online', () => location.reload());
    return;
  }

  if (page === 'home') renderHome(apps, params);
  if (page === 'view') renderView(apps, params);
})();
