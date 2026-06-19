import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { createYooKassaPayment } from "@/lib/yookassa/client";
import { isYooKassaConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  amountRub: z.number().min(1).max(1_000_000),
  description: z.string().min(3).max(200).optional(),
});

/** POST /api/yookassa/create — создание платежа. */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!isYooKassaConfigured()) {
      return NextResponse.json({ error: "yookassa_not_configured" }, { status: 503 });
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const description = parsed.data.description ?? "Оплата подписки";

    const payment = await createYooKassaPayment({
      userId: session.user.id,
      amountRub: parsed.data.amountRub,
      description,
      returnUrl: `${appUrl.replace(/\/$/, "")}/billing?status=return`,
    });

    const dbPayment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        yookassaId: payment.id,
        amountRub: parsed.data.amountRub,
        status: "PENDING",
        description,
        confirmationUrl: payment.confirmation?.confirmation_url ?? null,
        metadata: payment.metadata ?? {},
      },
    });

    return NextResponse.json({
      paymentId: dbPayment.id,
      yookassaId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url,
    });
  } catch (err) {
    console.error("[yookassa/create]", err);
    return NextResponse.json({ error: "payment_create_failed" }, { status: 500 });
  }
}
