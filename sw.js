// Service worker : hors ligne + mises a jour automatiques.
//
// Strategie :
//  - HTML / navigation  -> "reseau d'abord" : si internet, on prend la derniere
//    version (donc les mises a jour arrivent seules), sinon on sert le cache.
//  - autres fichiers (JS, CSS, polices, icones) -> "cache d'abord" avec
//    rafraichissement en arriere-plan (stale-while-revalidate).
//
// Pas besoin de changer de numero a chaque mise a jour : le contenu se met a
// jour tout seul des qu'il y a une connexion.
const CACHE = 'oeufs-cache';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/js/jspdf.umd.min.js',
  './assets/js/jspdf.plugin.autotable.min.js',
  './assets/fonts/fonts.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isHtml(req) {
  return req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // HTML : reseau d'abord (mises a jour auto), repli sur le cache hors ligne.
  if (isHtml(req)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Autres ressources : cache d'abord + rafraichissement en arriere-plan.
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && req.url.startsWith(self.location.origin)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
