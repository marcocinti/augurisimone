// Service worker minimo: permette di installare il gioco sulla schermata Home
// e di giocarci anche offline. Strategia "prima la rete": gli aggiornamenti
// pubblicati arrivano subito, la copia salvata serve solo senza connessione.
const CACHE = 'corri-simone-v3';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return r;
      })
      .catch(async () => {
        const hit = await caches.match(e.request, { ignoreSearch: true });
        if (hit) return hit;
        // senza connessione, l'apertura dell'app ripiega sulla pagina del gioco
        if (e.request.mode === 'navigate') return (await caches.match('./')) || Response.error();
        return Response.error();
      })
  );
});
