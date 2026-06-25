import { YooKassaWebhookBodySchema } from "@/lib/security/api-body-schemas";
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

  let json: unknown;
  try {
    json = JSON.parse(rawBody) as unknown;
  } catch {
    return { ok: false, status: 400, message: "Некорректный JSON webhook." };
  }

  const parsed = YooKassaWebhookBodySchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, status: 400, message: "Некорректная структура webhook." };
  }

  const event = parsed.data as YooKassaWebhookEvent;

  return { ok: true, event, rawBody };
}
