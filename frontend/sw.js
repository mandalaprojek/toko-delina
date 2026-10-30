/**
 * sw.js - Service Worker Ringan PWA Delina.store
 * Memenuhi syarat PWA installable browser Chromium (Chrome/Edge/Brave/Samsung Internet)
 */

const CACHE_NAME = "delina-store-pwa-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./css/custom.css",
  "./js/app.js",
  "./js/config.js",
  "./js/printer.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/icon.svg"
];

// 1. Install Event: Cache Core Static Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Notice cache partial error:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Bersihkan cache versi lama & klaim kontrol
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-First untuk Google Apps Script & Stale-While-Revalidate untuk aset lokal
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Jangan cache POST/PUT/DELETE atau request ke Google Apps Script / CDN dinamis
  if (req.method !== "GET" || url.hostname.includes("script.google.com") || url.hostname.includes("script.googleusercontent.com")) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback jika offline
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
