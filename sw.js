/**
 * sw.js - Service Worker Ringan PWA Delina.store
 * Versi v20261106-01 (Full-Bleed Poster Immersive & Direct Hadiah Navigation)
 */

const CACHE_NAME = "delina-store-pwa-v20261106-01";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./css/custom.css?v=20261106_01",
  "./js/app.js?v=20261106_01",
  "./js/config.js?v=20261106_01",
  "./js/printer.js?v=20261106_01",
  "./manifest.json",
  "./assets/Logo.png",
  "./assets/logo.png",
  "./assets/app-bg.jpg",
  "./assets/kiko-bg.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/icon.svg"
];

// 1. Install Event: Cache Core Static Shell & Langsung Aktifkan
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Notice cache partial error:", err);
      });
    })
  );
});

// 2. Activate Event: Bersihkan seluruh cache versi lama & klaim kontrol seketika
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Menghapus cache versi lama:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
      .then(() => {
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: "SW_ACTIVATED", version: CACHE_NAME });
          });
        });
      })
  );
});

// 3. Fetch Event: Network-First untuk Kode (HTML, JS, CSS) & Stale-While-Revalidate untuk Aset Statis
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (!req.url.startsWith("http://") && !req.url.startsWith("https://")) {
    return;
  }

  const url = new URL(req.url);

  if (req.method !== "GET" || (url.protocol !== "http:" && url.protocol !== "https:")) {
    return;
  }

  // Bypass Google Apps Script & external APIs
  if (url.hostname.includes("script.google.com") || url.hostname.includes("script.googleusercontent.com")) {
    return;
  }

  // Gunakan Network-First dengan no-cache untuk HTML, JS, dan CSS agar update kode langsung tampil
  const isCodeAsset =
    req.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname === "/" ||
    url.pathname.endsWith("/");

  if (isCodeAsset) {
    event.respondWith(
      fetch(req, { cache: "no-cache" })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache).catch(() => { });
            }).catch(() => { });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            return cached || (req.mode === "navigate" ? caches.match("./index.html") : null);
          });
        })
    );
    return;
  }

  // Aset statis (gambar, font): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache).catch(() => { });
            }).catch(() => { });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
