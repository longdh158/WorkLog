const CACHE = "worklog-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // HTML (index.html): network-first — luon lay ban moi nhat neu co mang
  if (e.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Assets (manifest, icon): stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(e.request).then((cached) => {
        const fetching = fetch(e.request).then((res) => {
          cache.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetching;
      })
    )
  );
});
