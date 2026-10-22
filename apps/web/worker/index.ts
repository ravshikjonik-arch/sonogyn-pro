/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

/** Обновление по кнопке «Обновить» (skipWaiting: false в workbox). */
self.addEventListener("message", (event) => {
  const data = event.data as { type?: string } | undefined;
  if (data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

export {};
