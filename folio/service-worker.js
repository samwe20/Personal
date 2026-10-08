/* Replaced with content-addressed assets by the production build. */
const ASSETS = __PRECACHE__;
const ROOT = new URL("./", self.location.href);
const PREFIX = `folio:${ROOT.href}:`;
const CACHE = PREFIX + "__VERSION__";
const URLS = new Set(ASSETS.map(path => new URL(path, ROOT).href));

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...URLS])));
  // Existing sessions keep their version until every old tab is closed.
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)),
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== ROOT.origin || !url.href.startsWith(ROOT.href)) return;
  if (request.mode === "navigate") {
    event.respondWith(caches.open(CACHE).then(async cache =>
      (await cache.match(new URL("index.html", ROOT).href)) || fetch(request)));
  } else if (URLS.has(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
  }
});
