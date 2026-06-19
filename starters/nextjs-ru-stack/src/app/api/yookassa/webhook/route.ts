import { NextResponse } from "next/server";

import { fetchYooKassaPayment } from "@/lib/yookassa/client";
import type { YooKassaWebhookEvent } from "@/lib/yookassa/types";
import { isYooKassaConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { mapYooKassaStatus, notifyTelegram } from "@/lib/telegram/notify";

export const runtime = "nodejs";

/** POST /api/yookassa/webhook — уведомления от ЮKassa. */
export async function POST(req: Request) {
  if (!isYooKassaConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    const event = (await req.json()) as YooKassaWebhookEvent;
    const yookassaId = event.object?.id;
    if (!yookassaId) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    // Верификация: повторный запрос статуса в API ЮKassa (не доверяем только webhook body)
    const remote = await fetchYooKassaPayment(yookassaId);
    const status = mapYooKassaStatus(remote.status);

    const payment = await prisma.payment.findUnique({ where: { yookassaId } });
    if (!payment) {
      return NextResponse.json({ ok: true, note: "unknown_payment" });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status, metadata: remote.metadata ?? {} },
    });

    if (status === "SUCCEEDED") {
      await notifyTelegram({
        event: "payment.succeeded",
        userId: payment.userId,
        payload: {
          yookassaId,
          amount: remote.amount.value,
          currency: remote.amount.currency,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[yookassa/webhook]", err);
    return NextResponse.json({ error: "webhook_failed" }, { status: 500 });
  }
}
