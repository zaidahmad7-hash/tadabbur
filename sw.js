// Tadabbur offline support: the app shell, fonts, and every passage you have opened stay available without a connection.
const CACHE = 'tadabbur-v2';
const DATA = 'tadabbur-data-v1';
const SHELL = ['./', 'index.html', 'style.css?v=2', 'app.js?v=2', 'data.js?v=2', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== DATA).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const swr = (req, name) => caches.open(name).then(c => c.match(req).then(hit => {
  const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // App files: network first so updates arrive, cached copy when offline.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
    return;
  }
  // Quran data and fonts: serve from cache instantly, refresh in the background.
  if (url.hostname === 'api.quran.com') { e.respondWith(swr(req, DATA)); return; }
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) { e.respondWith(swr(req, CACHE)); }
  // Audio streams straight from the network.
});
