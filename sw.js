/* اسمارٹ تنخواہ سسٹم — Service Worker (آفلائن) */
const CACHE = 'payroll-v4';
const ASSETS = [
  './',
  'index.html',
  'xlsx.full.min.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png'
];

/* انسٹال: ایپ کی بنیادی فائلیں محفوظ کرو */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

/* ایکٹیویٹ: پرانے کیش صاف کرو */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* فیچ: پہلے کیش، پھر نیٹ ورک؛ فونٹس بھی چلتے چلتے محفوظ ہو جائیں */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      try {
        const url = new URL(req.url);
        if (url.origin === location.origin || /gstatic|googleapis|cdnjs/.test(url.host)) {
          const c = await caches.open(CACHE);
          c.put(req, res.clone());
        }
      } catch (_) {}
      return res;
    } catch (_) {
      /* آفلائن اور کیش میں نہیں → ایپ کا صفحہ دکھا دو */
      if (req.mode === 'navigate') return caches.match('index.html');
      return new Response('', { status: 504, statusText: 'offline' });
    }
  })());
});
