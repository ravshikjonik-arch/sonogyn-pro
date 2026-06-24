import { NextResponse } from "next/server";

import { isInternalNotifyAuthorized } from "@/lib/security/internal-notify-auth";
import { TelegramService } from "@/services/telegram";

export const runtime = "nodejs";

type NotifyBody = {
  event?: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Единый фасад для внутренних admin-уведомлений в Telegram.
 *
 * Auth: Authorization: Bearer <CRON_SECRET> | x-cron-secret | x-sonogyn-internal-secret
 */
export async function POST(req: Request) {
  if (!isInternalNotifyAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: NotifyBody;
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const event = body.event?.trim();
  const message = body.message?.trim();
  if (!event || !message) {
    return NextResponse.json({ error: "Required: event, message" }, { status: 400 });
  }

  const metadata =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};

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
