import { NextResponse } from "next/server";

import { isInternalNotifyAuthorized } from "@/lib/security/internal-notify-auth";
import {
  InternalNotifyBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { TelegramService } from "@/services/telegram";

export const runtime = "nodejs";

/**
 * Единый фасад для внутренних admin-уведомлений в Telegram.
 *
 * Auth: Authorization: Bearer <CRON_SECRET> | x-cron-secret | x-sonogyn-internal-secret
 */
export async function POST(req: Request) {
  if (!isInternalNotifyAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = InternalNotifyBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { event, message, metadata = {} } = parsed.data;

  const { sent, total } = await TelegramService.notifyAdmins(event, {
    message,
    ...metadata,
  });

  return NextResponse.json({
    success: true,
    telegramSent: sent > 0,
    sent,
    total,
    configured: TelegramService.isConfigured(),
  });
}
