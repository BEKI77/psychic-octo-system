// §37 PWA Strategy — static-asset caching ONLY.
//
// This deliberately does not cache API responses, queue offline mutations,
// or serve cached HTML for navigations. Per the design: "Do not treat PWA
// caching as permission to perform inventory mutations without server
// confirmation." A warehouse worker's view of cylinder state must always
// come from a live round-trip to the API, never a stale cache entry — the
// value here is just faster loads of the JS/CSS shell and the app icon,
// not offline operation.
const CACHE_NAME = "cylinder-inventory-static-v1";
const STATIC_PATH_PATTERNS = [/^\/_next\/static\//, /^\/icon\.svg$/, /^\/favicon\.ico$/];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever intercept safe, idempotent reads — every mutation (and every
  // API call at all) goes straight to the network, untouched.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (!STATIC_PATH_PATTERNS.some((pattern) => pattern.test(url.pathname))) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }),
  );
});
