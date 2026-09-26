// Cache public source files only. Never cache APIs, cookies, messages, profiles or external sites.
const CACHE = 'hero-public-f9-v1';
const unavailableClients = new Set();
const PUBLIC_FILES = ['/index.html', '/plan.html', '/offline.html', '/styles.css', '/language.cjs', '/accessibility.js', '/locality-picker.js', '/app.js', '/plan.js', '/localities.cjs', '/referrals.cjs', '/preparedness.cjs', '/profile.cjs'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PUBLIC_FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('hero-public-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'hero-public-status' && event.source) event.source.postMessage({ type: 'hero-public-status', fallback: unavailableClients.has(event.source.id) });
});
async function notify(event, fallback) {
  const id = event.resultingClientId || event.clientId;
  if (!id) return;
  if (fallback) unavailableClients.add(id); else unavailableClients.delete(id);
  const client = await self.clients.get(id);
  client?.postMessage({ type: 'hero-public-status', fallback });
}
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  const path = url.pathname === '/' ? '/index.html' : url.pathname;
  if (PUBLIC_FILES.includes(path)) {
    // Short network-first check; use the versioned bundled public shell on failure.
    let fallback = false;
    const responsePromise = (async () => {
      try {
        const response = await fetch(request, { signal: AbortSignal.timeout(3500) });
        if (response.ok) return response;
      } catch { /* Offline or slow connection. */ }
      fallback = true;
      return (await caches.match(path, { cacheName: CACHE })) || Response.error();
    })();
    event.respondWith(responsePromise);
    event.waitUntil(responsePromise.then(() => notify(event, fallback)));
  } else if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html', { cacheName: CACHE })));
  }
});
