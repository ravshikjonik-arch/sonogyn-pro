import { NextResponse } from "next/server";
import { z } from "zod";

import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, hashOtpCode, normalizePhoneRu, sendOtpSms } from "@/lib/sms";

export const runtime = "nodejs";

const bodySchema = z.object({
  phone: z.string().min(10).max(20),
});

/** POST /api/sms/send — отправка OTP на телефон. */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    }

    const phone = normalizePhoneRu(parsed.data.phone);
    if (!phone) {
      return NextResponse.json({ error: "invalid_phone_format" }, { status: 400 });
    }

    const { SMS_OTP_TTL_SEC } = getEnv();
    const code = generateOtpCode();
    const codeHash = hashOtpCode(code, phone);

    await prisma.sMSVerification.create({
      data: {
        phone,
        codeHash,
        expiresAt: new Date(Date.now() + SMS_OTP_TTL_SEC * 1000),
      },
    });

    const sent = await sendOtpSms(phone, code);
    if (!sent.ok) {
      return NextResponse.json({ error: sent.errorCode ?? "sms_failed" }, { status: 502 });
    }

    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json({
      ok: true,
      ...(isDev ? { devCode: code } : {}),
    });
  } catch (err) {
    console.error("[sms/send]", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
