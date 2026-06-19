import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  checkSmsSendRateLimit,
  generateOtpCode,
  hashOtpCode,
  normalizePhoneRu,
  sendOtpSms,
} from "@/lib/sms";

export const runtime = "nodejs";

const bodySchema = z.object({
  phone: z.string().min(10).max(20),
});

/** POST /api/auth/sms/send — отправка OTP (sms.ru). */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверный формат номера телефона." }, { status: 400 });
    }

    const phone = normalizePhoneRu(parsed.data.phone);
    if (!phone) {
      return NextResponse.json(
        { error: "Неверный формат. Используйте российский номер: +7XXXXXXXXXX." },
        { status: 400 },
      );
    }

    const rate = await checkSmsSendRateLimit(phone);
    if (!rate.ok) {
      return NextResponse.json(
        { error: rate.error },
        {
          status: 429,
          headers: rate.retryAfterSec ? { "Retry-After": String(rate.retryAfterSec) } : undefined,
        },
      );
    }

    const session = await auth();
    const { SMS_OTP_TTL_SEC } = getEnv();
    const code = generateOtpCode();
    const codeHash = hashOtpCode(code, phone);

    await prisma.sMSVerification.create({
      data: {
        phone,
        codeHash,
        userId: session?.user?.id ?? null,
        expiresAt: new Date(Date.now() + SMS_OTP_TTL_SEC * 1000),
      },
    });

    const sent = await sendOtpSms(phone, code);
    if (!sent.ok) {
      return NextResponse.json({ error: sent.message ?? "Не удалось отправить SMS." }, { status: 502 });
    }

    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json({
      ok: true,
      phone,
      expiresInSec: SMS_OTP_TTL_SEC,
      ...(isDev ? { devCode: code } : {}),
    });
  } catch (err) {
    console.error("[auth/sms/send]", err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
