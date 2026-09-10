/* The build injects an exact allowlist. Never cache account, library, or remote-session traffic. */
async function downloadAssets(removeOnFailure = false) {
    const cache = await caches.open(CACHE_NAME);
    try {
      for (const path of ASSETS) {
        const response = await fetch(new Request(path, { cache: 'reload', credentials: 'omit' }));
        if (!response.ok || response.redirected) throw new Error(`Offline download failed: ${path}`);
        if (path.startsWith('/api/bible?')) {
          const data = await response.clone().json();
          if (!data.verses || !Object.keys(data.verses).length) throw new Error('Empty Bible download');
        }
        await cache.put(path, response);
      }
    } catch (error) {
      if (removeOnFailure) await caches.delete(CACHE_NAME);
      throw error;
    }
}
self.addEventListener('install', event => event.waitUntil(downloadAssets(true)));
// Let an existing study session finish before a new version takes over.
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('fb-bible-offline-') && key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (!['OFFLINE_STATUS', 'OFFLINE_REPAIR'].includes(event.data?.type)) return;
  event.waitUntil((async () => {
    if (event.data.type === 'OFFLINE_REPAIR') {
      try { await downloadAssets(); } catch { event.ports[0]?.postMessage({ ready: false }); return; }
    }
    const cache = await caches.open(CACHE_NAME);
    const ready = (await Promise.all(ASSETS.map(path => cache.match(path)))).every(Boolean);
    event.ports[0]?.postMessage({ ready });
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('authorization')) return;
  // Only the public root document is an offline navigation target. Never cache query tokens or RSC responses.
  const rootNavigation = request.mode === 'navigate' && url.pathname === '/' && !url.search;
  const key = url.pathname + url.search;
  if (!rootNavigation && !ASSETS.includes(key)) return;
  if (!rootNavigation && url.pathname === '/') return;
  event.respondWith((async () => {
    const cached = await (await caches.open(CACHE_NAME)).match(rootNavigation ? '/' : key);
    // Keep the cached document paired with this build's JS; updates activate after open tabs close.
    return cached || fetch(request);
  })());
});
