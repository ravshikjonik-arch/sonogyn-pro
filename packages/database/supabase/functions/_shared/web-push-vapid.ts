/** Web Push (VAPID) batch sender for PWA subscriptions. */

export type WebPushRow = {
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

export type WebPushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

function envKeys(): { publicKey: string; privateKey: string; subject: string } | null {
  const publicKey =
    Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY")?.trim() ||
    Deno.env.get("VAPID_PUBLIC_KEY")?.trim() ||
    "";
  const privateKey =
    Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY")?.trim() ||
    Deno.env.get("VAPID_PRIVATE_KEY")?.trim() ||
    "";
  const subject =
    Deno.env.get("WEB_PUSH_VAPID_SUBJECT")?.trim() ||
    Deno.env.get("VAPID_SUBJECT")?.trim() ||
    "mailto:support@sonogyn-pro.ru";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export async function sendWebPushBatch(
  subscriptions: WebPushRow[],
  payload: WebPushPayload,
): Promise<{ sent: number; failed: number; skipped: boolean }> {
  const keys = envKeys();
  if (!keys || subscriptions.length === 0) {
    return { sent: 0, failed: 0, skipped: !keys };
  }

  const webpush = await import("npm:web-push@3.6.7");
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth_key },
        },
        body,
      );
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return { sent, failed, skipped: false };
}
