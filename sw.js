const CACHE_NAME = 'cyber-fleet-v3.2';
const ASSETS = [
  './',
  './index.html',
  './szef.html',
  './dyspozytor.html',
  './kierowca.html',
  './app.js',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Przechwytywanie i keszowanie kafelków mapy Leaflet (Carto / OpenStreetMap)
  if (e.request.url.includes('basemaps.cartocdn.com') || e.request.url.includes('tile.openstreetmap.org')) {
    e.respondWith(
      caches.open('cyber-map-tiles').then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const res = await fetch(e.request);
          cache.put(e.request, res.clone());
          return res;
        } catch (err) {
          return cached;
        }
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});