/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

/** Новая версия включает себя сама и заново открывает главную. */
self.addEventListener("message", (event) => {
  const data = event.data as { type?: string } | undefined;
  if (data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      await Promise.all(
        clients.map(async (client) => {
          const path = new URL(client.url).pathname;
          if (path === "/" || path === "/home" || path === "/home/") {
            await client.navigate(client.url);
          }
        }),
      );
    }),
  );
});

export {};
