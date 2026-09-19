const CACHE = "ledger-v5";
const SHELL = [
  "/",
  "/dashboard",
  "/transactions",
  "/insights",
  "/budgets",
  "/accounts",
  "/settings",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable.png",
  "/icons/apple-touch-icon.png",
];

function isAuthCallback(url) {
  return url.pathname.startsWith("/auth/callback") || url.pathname.startsWith("/auth/confirm");
}

function isNavigation(request) {
  return request.mode === "navigate" || request.destination === "document";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(
          SHELL.map((url) => cache.add(url).catch(() => undefined)),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isAuthCallback(url)) return;

  if (isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const path = url.pathname;
          const shellHit = await caches.match(path);
          if (shellHit) return shellHit;
          return (await caches.match("/")) || Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.pathname.startsWith("/_next/") === false) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        } else if (response.ok && url.pathname.startsWith("/_next/static/")) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
  );
});
