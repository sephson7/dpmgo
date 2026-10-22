/* DPM - Go! service worker.
 *
 * The app is a transit companion, so the one thing it must never do is fail
 * because a rider lost cell service in a tunnel or on the lower level. This
 * worker keeps the app shell, the stylesheets, the station datasets and the
 * icons on the device and serves them when the network is gone.
 *
 * How the caching is decided:
 *  - On install the worker reads the app shell and precaches the exact hashed
 *    stylesheets and module chunks the shell asks for. The People Mover and
 *    QLINE timetables, the stop lists and the street shapes live in those
 *    chunks, so the station datasets are cached with them.
 *  - The map is imported lazily, so the worker follows the dynamic imports
 *    of those chunks and precaches the map bundle and its stylesheet too.
 *  - Hashed build output is served immutable by the CDN, so it is served cache
 *    first and never revalidated.
 *  - The shell document is served network first, so a new deploy is picked up
 *    as soon as the device is back online, and falls back to the cached copy
 *    when the rider is offline.
 *  - The partner portal, the Stripe checkout, the slot API and the map tiles
 *    are never cached: they are personal, transactional or third party.
 */

const VERSION = 'dpmgo-v2';
const SHELL_CACHE = `dpmgo-shell-${VERSION}`;
const ASSET_CACHE = `dpmgo-assets-${VERSION}`;
const FONT_CACHE = `dpmgo-fonts-${VERSION}`;
const CACHES = [SHELL_CACHE, ASSET_CACHE, FONT_CACHE];

/** The stable, unhashed files that make up the shell and the icons. */
const SHELL_FILES = [
  '/manifest.json',
  '/favicon.png',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

/** How long a navigation waits for the network before the cache takes over. */
const NAVIGATION_TIMEOUT_MS = 8000;

/* ------------------------------------------------------------------ install */

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
  self.skipWaiting();
});

/**
 * Caches the shell and everything the shell depends on.
 *
 * The shell document lists the hashed stylesheets and module chunks the app
 * needs, so reading it is how the worker learns the names of this build
 * without a manifest that has to be regenerated on every deploy.
 */
async function precache() {
  const shell = await caches.open(SHELL_CACHE);
  const assets = await caches.open(ASSET_CACHE);

  const assetUrls = new Set();
  try {
    const response = await fetch('/', { cache: 'reload' });
    if (response && response.ok) {
      await shell.put('/', response.clone());
      for (const url of shellAssets(await response.text())) assetUrls.add(url);
    }
  } catch {
    // Offline while installing: the runtime cache fills the gap later.
  }

  for (const url of SHELL_FILES) {
    try {
      const response = await fetch(url, { cache: 'reload' });
      if (response && response.ok) await shell.put(url, response);
    } catch {
      // A missing icon must never stop the worker from installing.
    }
  }

  // Cache the shell's chunks and read them to find what they load lazily.
  const lazy = new Set();
  await Promise.all(
    [...assetUrls].map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'reload' });
        if (!response || !response.ok) return;
        await assets.put(url, response.clone());
        if (url.endsWith('.js')) {
          for (const found of lazyAssets(await response.text(), url)) lazy.add(found);
        }
      } catch {
        // One missing chunk must not fail the install.
      }
    }),
  );

  // And cache the map bundle and its stylesheet, which the app only asks
  // for once it has run.
  await Promise.all(
    [...lazy].map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'reload' });
        if (response && response.ok) await assets.put(url, response);
      } catch {
        // Same here: a chunk that cannot be fetched is simply not cached.
      }
    }),
  );
}

/**
 * The same-origin files the shell document asks for: the stylesheets, the
 * module chunks that carry the station datasets, and the images.
 */
function shellAssets(html) {
  const found = new Set();
  const pattern = /(?:href|src)="([^"]+)"/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const value = match[1];
    if (!value.startsWith('/')) continue;
    if (
      value.startsWith('/assets/') ||
      /\.(?:js|css|json|png|jpe?g|svg|webp|ico|woff2?)$/i.test(value)
    ) {
      found.add(value);
    }
  }
  return found;
}

/**
 * The files a chunk reaches for later: the bundles it imports dynamically and
 * the stylesheets it pulls in. The map is one of them.
 */
function lazyAssets(text, baseUrl) {
  const found = new Set();
  const dir = baseUrl.slice(0, baseUrl.lastIndexOf('/') + 1);
  const root = new URL(dir, self.location.origin);

  const imports = /\bimport\(\s*["'`](\.\/[^"'`]+)["'`]\s*\)/g;
  let match;
  while ((match = imports.exec(text)) !== null) {
    found.add(new URL(match[1], root).pathname);
  }

  const assets = /["'](\/?assets\/[^"']+)["']/g;
  while ((match = assets.exec(text)) !== null) {
    found.add(new URL(match[1], self.location.origin).pathname);
  }

  return found;
}

/* ----------------------------------------------------------------- activate */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('dpmgo-') && !CACHES.includes(name))
          .map((name) => caches.delete(name)),
      );
      await trimAssetCache();
      await self.clients.claim();
    })(),
  );
});

/**
 * Every deploy adds a new set of hashed files, so the asset cache would grow
 * without end. The files of the current build are the newest ones, so the
 * oldest entries are the ones of the builds before it.
 */
async function trimAssetCache() {
  const limit = 120;
  const assets = await caches.open(ASSET_CACHE);
  const keys = await assets.keys();
  if (keys.length <= limit) return;
  for (const request of keys.slice(0, keys.length - limit)) {
    await assets.delete(request);
  }
}

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  const data = event.data;
  if (data && data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    // The page reports the resources it loaded. The chunks that are imported
    // lazily are only known once the app has run, so this is what puts the
    // rest of the build in the cache for the next offline visit.
    event.waitUntil(cacheUrls(data.urls));
  }
});

/** Caches same-origin resources the page has already loaded. */
async function cacheUrls(urls) {
  const assets = await caches.open(ASSET_CACHE);
  await Promise.all(
    urls.map(async (url) => {
      try {
        const parsed = new URL(url, self.location.origin);
        if (parsed.origin !== self.location.origin) return;
        // The partner portal and the slot assignments are never cached, and
        // the worker script does not need to be.
        if (parsed.pathname.startsWith('/api/') || parsed.pathname === '/sw.js') return;
        if (await assets.match(parsed.href)) return;
        const response = await fetch(parsed.href, { cache: 'reload' });
        if (isCacheable(response)) await assets.put(parsed.href, response);
      } catch {
        // A resource that cannot be fetched is simply not cached.
      }
    }),
  );
}

/* -------------------------------------------------------------------- fetch */

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Anything that changes state goes straight to the network.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    if (url.hostname === 'fonts.googleapis.com') {
      event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
      return;
    }
    if (url.hostname === 'fonts.gstatic.com') {
      event.respondWith(cacheFirst(request, FONT_CACHE));
      return;
    }
    // Mapbox tiles, the Stripe pricing table and telemetry stay on the network.
    return;
  }

  // The partner portal, the checkout and the slot assignments are personal
  // and change often, so they are never cached.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigation(request));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (url.pathname.startsWith('/data/') || isStaticFile(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }
});

/** True for the file types that make up the app shell. */
function isStaticFile(pathname) {
  return /\.(?:json|png|jpe?g|svg|webp|ico|woff2?)$/i.test(pathname);
}

/* ----------------------------------------------------------------- strategies */

/**
 * The shell: fresh from the network when there is one, the cached copy when
 * the rider is offline.
 */
async function navigation(request) {
  const shell = await caches.open(SHELL_CACHE);
  try {
    const response = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
    if (response && response.ok) shell.put(request, response.clone());
    return response;
  } catch {
    const exact = await shell.match(request);
    if (exact) return exact;
    const home = await shell.match('/');
    if (home) return home;
    return offlineResponse();
  }
}

/** Hashed build output and fonts: served from the cache when it is there. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) cache.put(request, response.clone());
  return response;
}

/** Everything else static: the cached copy now, the network in the background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (isCacheable(response)) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  if (cached) return cached;
  const response = await network;
  if (response) return response;
  throw new Error('offline and nothing cached');
}

/** Only a plain successful response belongs in the cache. */
function isCacheable(response) {
  return Boolean(response) && response.ok && response.type === 'basic';
}

/** A navigation that gives up on the network still gets an answer. */
function fetchWithTimeout(request, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

/** The last resort, for a device that has never been online. */
function offlineResponse() {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>DPM - Go! | Offline</title>
    <style>
      body {
        margin: 0;
        min-height: 100dvh;
        display: grid;
        place-content: center;
        gap: 14px;
        text-align: center;
        background: #070b14;
        color: #e6edf5;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        padding: 24px;
      }
      strong { color: #00f0ff; letter-spacing: 0.08em; }
      a { color: #00f0ff; }
    </style>
  </head>
  <body>
    <strong>DPM - GO!</strong>
    <p>This device has not cached the app yet.</p>
    <p>Connect to a network once and the map works offline afterwards.</p>
    <a href="/">Try again</a>
  </body>
</html>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
