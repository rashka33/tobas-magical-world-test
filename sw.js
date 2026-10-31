/* Offline shell for Toba's Magical World — build 2026-10-30-bluey-h2e2.
   Versioned cache. Precache the app shell and hub art.
   index.html is network-first so a fresh link is not stuck on an old shell. */
var BUILD_ID = "2026-10-30-bluey-h2e2";
var CACHE = "tcw-" + BUILD_ID;

var PRECACHE = [
  "./",
  "./index.html",
  "./assets/app.css",
  "./assets/app.js",
  "./assets/bluey-hub.css",
  "./assets/bluey-hub.js",
  "./assets/icon.webp",
  "./assets/manifest.webmanifest",
  "./assets/art/hub-bubbles.webp",
  "./assets/art/hub-balloons.webp",
  "./assets/art/hub-feed.webp",
  "./assets/art/hub-memory.webp",
  "./assets/art/hub-puzzle.webp",
  "./assets/art/hub-counting.webp",
  "./assets/art/hub-patterns.webp",
  "./assets/art/hub-sorter.webp",
  "./assets/art/leo-wave.webp",
  "./assets/art/leo-cheer.webp",
  "./assets/art/title-landscape.webp",
  "./assets/art/title-portrait.webp",
  "./assets/art/logo-toba.webp",
  "./assets/art/banana.webp",
  "./assets/art/hub-dressup.webp",
  "./assets/art/hub-camel.webp",
  "./assets/art/leo-hello.webp",
  "./assets/art/leo-talk.webp",
  "./assets/art/p1/avatar-1.webp",
  "./assets/art/p1/avatar-2.webp",
  "./assets/art/p1/avatar-3.webp",
  "./assets/art/p1/avatar-4.webp",
  "./assets/art/p1/avatar-5.webp",
  "./assets/art/p1/avatar-6.webp",
  "./assets/art/p1/avatar-add.webp",
  "./assets/art/p1/lang-english.webp",
  "./assets/art/p1/lang-somali.webp"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE; }).map(function (key) {
          return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function isIndex(url) {
  if (url.origin !== self.location.origin) return false;
  var path = url.pathname;
  return path.endsWith("/index.html") || /\/$/.test(path);
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  if (isIndex(url)) {
    event.respondWith(networkFirst(req));
    return;
  }
  event.respondWith(cacheFirst(req));
});

function networkFirst(req) {
  return caches.open(CACHE).then(function (cache) {
    return fetch(req).then(function (fresh) {
      if (fresh && fresh.ok) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    }).catch(function () {
      return cache.match(req).then(function (hit) {
        return hit || cache.match("./index.html") || cache.match("./");
      });
    });
  });
}

function cacheFirst(req) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (fresh) {
        if (fresh && fresh.ok && fresh.type === "basic") {
          var path = new URL(req.url).pathname;
          if (/\.(css|js|webp|webmanifest|html|png|svg)$/.test(path)) {
            cache.put(req, fresh.clone());
          }
        }
        return fresh;
      });
    });
  });
}
