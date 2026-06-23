// sw.js - Service Worker para suporte offline (PWA)
const CACHE_NAME = 'trip-planner-v1';

// Arquivos locais e CDN para cachear na instalação
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/firebase-config.js',
  '/auth.js',
  '/store-firebase.js',
  '/utils.js',
  '/calendar.js',
  '/tabs.js',
  '/days.js',
  '/tours.js',
  '/links.js',
  '/hotels.js',
  '/map.js',
  '/guide.js',
  '/init.js',
  '/manifest.json',
  // Leaflet
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
  // Tabler Icons
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css',
];

// ─── Instalação: cacheia todos os assets ────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando assets...');
      // Cacheia um por um para não falhar tudo se um CDN der erro
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Falha ao cachear:', url, err);
          })
        )
      );
    })
  );
  // Ativa imediatamente sem esperar o tab fechar
  self.skipWaiting();
});

// ─── Ativação: limpa caches antigos ────────────────────────────────────────
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
  // Toma controle de todas as abas abertas imediatamente
  self.clients.claim();
});

// ─── Fetch: Cache First para assets, Network First para Firebase ─────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Deixa o Firebase passar direto (auth, firestore, gstatic)
  // O Firestore tem sua própria camada de persistência offline
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('googleapis')
  ) {
    return; // Não intercepta — deixa o Firebase gerenciar
  }

  // Para os tiles do OpenStreetMap (mapa): Network first, cache fallback
  if (url.hostname.includes('tile.openstreetmap')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Guarda o tile no cache para uso offline
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para todo o resto: Cache First (app shell + CDNs)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      // Não está no cache: busca na rede e guarda para próxima vez
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