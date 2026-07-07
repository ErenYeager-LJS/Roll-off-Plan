const CACHE_NAME = "nutrition-pwa-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./src/app.js",
  "./src/api.js",
  "./src/food-data.js",
  "./src/nutrition-core.js",
  "./src/storage.js",
  "./src/trends.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request);
    }),
  );
});
