import { PaymentStatus, Prisma } from "@prisma/client";

import { isTelegramConfigured } from "@/lib/env";
import { fetchWithRetry } from "@/lib/http/retry";
import { prisma } from "@/lib/prisma";

type NotifyInput = {
  event: string;
  userId?: string | null;
  payload?: Record<string, unknown>;
};

/** Отправка уведомления админу в Telegram + запись в БД. */
export async function notifyTelegram(input: NotifyInput): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();

  const record = await prisma.notification.create({
    data: {
      userId: input.userId ?? null,
      channel: "TELEGRAM",
      event: input.event,
      payload: (input.payload ?? {}) as Prisma.InputJsonValue,
      status: "PENDING",
    },
  });

  if (!isTelegramConfigured() || !token || !chatId) {
    await prisma.notification.update({
      where: { id: record.id },
      data: { status: "FAILED", error: "telegram_not_configured" },
    });
    return;
  }

  const text = formatTelegramMessage(input.event, input.payload);

  try {
    const res = await fetchWithRetry(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    await prisma.notification.update({
      where: { id: record.id },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (err) {
    await prisma.notification.update({
      where: { id: record.id },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : "telegram_send_failed",
      },
    });
  }
}

function formatTelegramMessage(event: string, payload?: Record<string, unknown>): string {
  const lines = [`<b>${escapeHtml(event)}</b>`];
  if (payload) {
    for (const [k, v] of Object.entries(payload)) {
      lines.push(`${escapeHtml(k)}: ${escapeHtml(String(v))}`);
    }
  }
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function mapYooKassaStatus(status: string): PaymentStatus {
  switch (status) {
    case "succeeded":
      return PaymentStatus.SUCCEEDED;
    case "canceled":
      return PaymentStatus.CANCELED;
    case "waiting_for_capture":
      return PaymentStatus.WAITING_FOR_CAPTURE;
    case "pending":
      return PaymentStatus.PENDING;
    default:
      return PaymentStatus.FAILED;
  }
}
