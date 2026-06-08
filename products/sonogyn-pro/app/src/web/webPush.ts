/**
 * Web Push: клиентская часть. Полный цикл требует бэкенда (VAPID + сохранение subscription).
 *
 * Env (опционально):
 * - EXPO_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY — публичный ключ VAPID (URL-safe base64)
 * - EXPO_PUBLIC_WEB_PUSH_REGISTER_URL — POST endpoint для отправки JSON subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = typeof atob !== "undefined" ? atob(base64) : "";
  const buffer = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    buffer[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

export async function registerWebPushIfConfigured(): Promise<void> {
  if (typeof window === "undefined") return;

  const vapidPublic = process.env.EXPO_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const registerUrl = process.env.EXPO_PUBLIC_WEB_PUSH_REGISTER_URL?.trim();

  if (!vapidPublic || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (!("PushManager" in window)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic) as globalThis.BufferSource,
      });
    }

    if (registerUrl && sub) {
      await fetch(registerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
        credentials: "omit",
      }).catch(() => undefined);
    }
  } catch {
    /* безопасный деград: PWA работает без push */
  }
}
