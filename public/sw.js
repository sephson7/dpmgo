/* One-release cleanup at the old app-worker URL. Home-screen metadata stays.
 * Remove only this app's custom caches and scoped Workbox buckets; never
 * touch Firebase Messaging or OneSignal registrations/caches.
 */
function isAppCache(name) {
  if (/^dpmgo-(?:shell|assets|fonts)-/.test(name)) return true;
  const bucket = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
  return bucket && name.endsWith(self.registration.scope);
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.allSettled(names.filter(isAppCache).map((name) => caches.delete(name)));
        await self.clients.claim();
        const windows = await self.clients.matchAll({ type: 'window' });
        await Promise.allSettled(windows.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);
