// sw.js - Service Worker para suporte offline (PWA)
const CACHE_NAME = 'trip-planner-v2';
const BASE = '/trip-planner';

const ASSETS_TO_CACHE = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/styles.css`,
  `${BASE}/manifest.json`,
  `${BASE}/firebase-config.js`,
  `${BASE}/auth.js`,
  `${BASE}/store-firebase.js`,
  `${BASE}/utils.js`,
  `${BASE}/calendar.js`,
  `${BASE}/tabs.js`,
  `${BASE}/days.js`,
  `${BASE}/tours.js`,
  `${BASE}/links.js`,
  `${BASE}/hotels.js`,
  `${BASE}/map.js`,
  `${BASE}/guide.js`,
  `${BASE}/init.js`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`,
  // CDNs
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css',
];

// ─── Instalação ──────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] Falha ao cachear:', url, err))
        )
      )
    )
  );
  self.skipWaiting();
});

// ─── Ativação: limpa caches antigos ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Deixa Firebase passar direto (tem persistência própria)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('googleapis')
  ) {
    return;
  }

  // Tiles do OpenStreetMap: network first, cache fallback
  if (url.hostname.includes('tile.openstreetmap')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Tudo mais: cache first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});