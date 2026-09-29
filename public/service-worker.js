// Retired service worker.
//
// An earlier version of the site registered a cache-first worker under the
// fixed cache name "long-jump-cache-v1". It answered "/" and "/index.html"
// from that cache forever, so returning visitors could be stuck on an old
// build. Nothing registers a worker any more, but browsers that already have
// the old one keep asking for this file, so this version cleans up after it:
// delete every cache, unregister, and reload open tabs onto the live site.
//
// There is deliberately no "fetch" handler, so this worker can never serve a
// stale response. Once every old visitor has picked it up and removed it,
// this file is safe to delete.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window' });
    windows.forEach((client) => client.navigate(client.url));
  })());
});
