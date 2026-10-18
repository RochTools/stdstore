/* STD App Store — service worker
   - صرف اسٹور کا ڈھانچہ (HTML/CSS/JS/آئیکن) محفوظ ہوتا ہے تاکہ ایپ انٹرنیٹ کے بغیر کھل سکے
   - apps.json اور ریویو کبھی محفوظ نہیں ہوتے، اس لیے انٹرنیٹ نہ ہو تو "No internet connection" دکھتا ہے
   - جب انٹرنیٹ ہو تو ہمیشہ تازہ فائل آتی ہے (پرانا کیش نہیں چلتا)
   فائلیں بدلنے کے بعد نیچے CACHE کا ورژن بڑھا دیں */
const CACHE = 'std-store-v3';
const SHELL = [
  '', 'index.html', 'view.html', 'info.html',
  'style.css', 'script.js', 'manifest.webmanifest',
  'icons/store.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
];
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const key = (url) => url.origin + url.pathname;
const isShell = (url) => url.origin === location.origin &&
  url.pathname.startsWith(SCOPE_PATH) && SHELL.includes(url.pathname.slice(SCOPE_PATH.length));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(SHELL.map((p) => cache.add(SCOPE_PATH + p).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!isShell(url)) return;               // apps.json، ایپس، Firebase وغیرہ کو چھیڑا نہیں جاتا

  event.respondWith((async () => {
    try {
            let res = await fetch(url.href, { cache: 'no-cache' });   // ہمیشہ سرور سے تازہ
      if (res && res.redirected) {
        // ری ڈائریکٹ شدہ جواب نیویگیشن کے لیے سیدھا واپس نہیں دے سکتے
        res = new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers });
      }
      if (res && res.ok) {
        const cache = await caches.open(CACHE);
        cache.put(key(url), res.clone());
      }
      return res;
    } catch (err) {
      const cached = await caches.match(key(url));
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const home = await caches.match(location.origin + SCOPE_PATH + 'index.html');
        if (home) return home;
      }
      return Response.error();
    }
  })());
});
