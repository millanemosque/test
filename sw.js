/* Offline support: app shell cached; timetable always fetched fresh when online.
   Each copy of the app (live / test) keeps its own cache. */
const SCOPE = self.registration.scope;
const CACHE = "mill-lane-v2|" + SCOPE;
const SHELL = ["./", "index.html", "common.js", "manifest.webmanifest", "times.json",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k !== CACHE && (k.endsWith("|" + SCOPE) || k === "mill-lane-v1")).map(k => caches.delete(k)))));
  self.clients.claim();
});
/* Network first (so new timetables & app updates show straight away), cache as fallback */
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || !e.request.url.startsWith(SCOPE)) return;
  const key = url.origin + url.pathname;   // ignore ?t= cache-busting
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key))
  );
});
