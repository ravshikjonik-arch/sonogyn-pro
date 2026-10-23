"use client";

import { getWebPushVapidPublicKeyClient, isDoctorChatWebPushEnabledClient } from "@/lib/chat/flags";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    buffer[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

export type WebPushRegisterResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "no_vapid" | "disabled" | "failed" };

/** Register PushManager subscription with SonoGyn API (Expo push unchanged). */
export async function registerDoctorChatWebPush(): Promise<WebPushRegisterResult> {
  if (typeof window === "undefined") return { ok: false, reason: "unsupported" };
  if (!isDoctorChatWebPushEnabledClient()) return { ok: false, reason: "disabled" };

  const vapidPublic = getWebPushVapidPublicKeyClient();
  if (!vapidPublic) return { ok: false, reason: "no_vapid" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, reason: "denied" };

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic) as BufferSource,
      });
    }

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: "failed" };
    }

    const res = await fetch("/api/push/web-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      }),
    });

    if (!res.ok) return { ok: false, reason: "failed" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
