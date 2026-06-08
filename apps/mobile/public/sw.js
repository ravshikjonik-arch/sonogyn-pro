/**
 * Service Worker — оболочка приложения, навигация и статические ресурсы.
 * Бандлы Metro имеют хэши в имени при export — кэшируются по правилам same-origin GET.
 *
 * Версию поднимайте при каждом релизе статики (иначе клиенты держат старый кэш).
 */
const CACHE_VERSION = "pwa-ag-us-v5";

/** Предзагрузка: точки входа и офлайн-фолбэк */
const APP_SHELL = [
  "/",
  "/app",
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

function isNavigate(request) {
  return request.mode === "navigate" || request.destination === "document";
}

function isStaticAsset(url) {
  return /\.(?:js|css|png|jpg|jpeg|webp|gif|svg|ico|woff2?|map)$/i.test(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

/** Push требует VAPID и бэкенд; здесь только безопасный UX-хук */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Уведомление", body: event.data ? event.data.text() : "" };
  }
  const title = typeof payload.title === "string" ? payload.title : "Помощник АГ и УЗИ";
  const body = typeof payload.body === "string" ? payload.body : "";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      lang: "ru",
      tag: typeof payload.tag === "string" ? payload.tag : "default",
      data: payload.data ?? {},
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen =
    event.notification.data && typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/app";
  event.waitUntil(self.clients.openWindow(urlToOpen));
});

/** Навигация: сеть → кэш → офлайн */
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const shell =
      (await caches.match("/app")) ||
      (await caches.match("/")) ||
      (await caches.match("/offline.html"));
    return shell || Response.error();
  }
}

/** Статика: кэш → сеть → обновить кэш (offline-first с подтяжкой) */
async function staleRefreshStatic(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    fetchPromise.catch(() => undefined);
    return cached;
  }
  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;
  return Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  if (isNavigate(request)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleRefreshStatic(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok && url.pathname !== "/sw.js") {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
