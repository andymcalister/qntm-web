const CACHE = "qntm-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", OFFLINE_URL]).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() =>
      caches.match(req).then((r) => r || caches.match(OFFLINE_URL))));
    return;
  }
  const url = new URL(req.url);
  if (url.origin === location.origin && /\.(png|jpg|jpeg|svg|ico|webp|woff2?|css|js)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    })));
  }
});

self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {}
  e.waitUntil(self.registration.showNotification(data.title || "QNTM alert", {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/screener" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || "/screener";
  e.waitUntil(clients.matchAll({ type: "window" }).then((wins) => {
    for (const w of wins) { if (w.url.includes(target) && "focus" in w) return w.focus(); }
    return clients.openWindow(target);
  }));
});
