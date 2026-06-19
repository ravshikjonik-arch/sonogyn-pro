import type { YooKassaWebhookEvent } from "@/lib/yookassa/types";

import { isYooKassaIp, resolveClientIp } from "./yookassa-ip";

export type WebhookGuardResult =
  | { ok: true; event: YooKassaWebhookEvent; rawBody: string }
  | { ok: false; status: number; message: string };

/**
 * Middleware webhook: raw body + IP ЮKassa + JSON parse.
 * ЮKassa не присылает HMAC-подпись для Basic Auth — проверяем IP и повторный запрос статуса в API.
 */
export function guardYooKassaWebhook(req: Request, rawBody: string): WebhookGuardResult {
  const clientIp = resolveClientIp(req.headers);
  if (!isYooKassaIp(clientIp)) {
    console.warn("[payment/webhook] rejected IP", clientIp || "unknown");
    return { ok: false, status: 403, message: "Webhook отклонён: недопустимый IP-адрес." };
  }

  if (!rawBody.trim()) {
    return { ok: false, status: 400, message: "Пустое тело webhook." };
  }

  let event: YooKassaWebhookEvent;
  try {
    event = JSON.parse(rawBody) as YooKassaWebhookEvent;
  } catch {
    return { ok: false, status: 400, message: "Некорректный JSON webhook." };
  }

  if (!event.object?.id) {
    return { ok: false, status: 400, message: "В webhook нет идентификатора платежа." };
  }

  return { ok: true, event, rawBody };
}
