/* =====================================================================
   MorphPDF - Service Worker
   -----------------------------------------------------------------------
   Strategy overview:
   - App shell (own files): precached at install, served cache-first.
   - Navigations (HTML):    network-first, fall back to cached shell,
                            then to the static offline page.
   - Trusted CDN libraries: stale-while-revalidate in a runtime cache so
                            tools keep working offline once downloaded.
   - Never cached: non-GET requests, blob:/data: URLs, opaque responses,
                   error responses, and anything the user's files produce
                   (all user processing happens client-side in blobs,
                   which never pass through the service worker anyway).
   - Versioned cache names + old-cache cleanup on activate.
   ===================================================================== */

const VERSION = 'v1.0.2';
const STATIC_CACHE = `morphpdf-static-${VERSION}`;
const RUNTIME_CACHE = `morphpdf-runtime-${VERSION}`;

/* Own app shell, all relative paths (GitHub Pages project site: /MorphPDF/) */
const APP_SHELL = [
  './',
  'index.html',
  'offline.html',
  'manifest.webmanifest',
  'favicon.svg',
  'favicon-32.png',
  'apple-touch-icon.png',
  'assets/style.css',
  'assets/config.js',
  'assets/script.js',
  'assets/pdf-tools.js',
  'assets/excel-tools.js',
  'assets/app.js',
  'assets/pwa.js',
  'assets/brand/logo-symbol.svg',
  'assets/brand/logo-symbol-dark.svg',
  'assets/brand/logo.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-192.png',
  'assets/icons/icon-maskable-512.png'
];

/* Third-party libraries the app depends on. They are cached at runtime
   (not blindly at install) and only if a clean 200/CORS response arrives. */
const CDN_HOSTS = [
  'cdn.tailwindcss.com',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Cache files one by one so one missing file cannot abort the install
      await Promise.allSettled(
        APP_SHELL.map((path) => cache.add(new Request(path, { cache: 'reload' })))
      );
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('morphpdf-') && !name.endsWith(`-${VERSION}`))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

function isTrustedCdn(url) {
  return CDN_HOSTS.includes(url.hostname);
}

function isCacheable(response) {
  // Never cache errors or opaque/no-cors responses "as if they succeeded"
  if (!response || !response.ok) return false;
  return response.type === 'basic' || response.type === 'cors';
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle safe, cacheable request types
  if (request.method !== 'GET') return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // App navigations: network-first with cache + offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          if (isCacheable(fresh) && url.origin === self.location.origin) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put('./index.html', fresh.clone());
          }
          return fresh;
        } catch (err) {
          const cache = await caches.open(STATIC_CACHE);
          return (
            (await cache.match('./index.html')) ||
            (await cache.match('./')) ||
            (await cache.match('./offline.html')) ||
            new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } })
          );
        }
      })()
    );
    return;
  }

  // Same-origin static assets: cache-first, refresh in background on miss
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          if (isCacheable(fresh)) cache.put(request, fresh.clone());
          return fresh;
        } catch (err) {
          return new Response('', { status: 504, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Trusted CDNs: stale-while-revalidate so offline reuse works after the
  // first successful download, and updates arrive on later online visits.
  if (isTrustedCdn(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (isCacheable(response)) cache.put(request, response.clone());
            return response;
          })
          .catch(() => undefined);
        return cached || (await network) || new Response('', { status: 504, statusText: 'Offline' });
      })()
    );
  }
  // Anything else (unknown third parties): let the browser handle it.
});
