// sw-v1.js
// NOTE: GitHub Pages' Fastly CDN edge-caches this file aggressively, and bumping
// only the CACHE_NAME string inside an unchanged filename has been unreliable
// (see PWA repo history). When you need to ship a real update, create a NEW
// file (sw-v2.js, sw-v3.js, ...) and update the registration path in index.html
// rather than editing this file in place.

const CACHE_NAME = "astro-persona-security-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data.js",
  "./auth-guard.js",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Network-first for Supabase API calls; cache-first for static assets.
  if (event.request.url.includes("supabase.co")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
