import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhoneRu, verifyOtpHash } from "@/lib/sms";

export const runtime = "nodejs";

const bodySchema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().regex(/^\d{6}$/, "Код — 6 цифр"),
});

/** POST /api/auth/sms/verify — проверка OTP и привязка телефона к аккаунту. */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверный формат данных." }, { status: 400 });
    }

    const phone = normalizePhoneRu(parsed.data.phone);
    if (!phone) {
      return NextResponse.json(
        { error: "Неверный формат номера. Используйте +7XXXXXXXXXX." },
        { status: 400 },
      );
    }

    const row = await prisma.sMSVerification.findFirst({
      where: { phone, verifiedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!row || !verifyOtpHash(parsed.data.code, phone, row.codeHash)) {
      if (row) {
        await prisma.sMSVerification.update({
          where: { id: row.id },
          data: { attempts: { increment: 1 } },
        });
      }
      return NextResponse.json({ error: "Неверный или просроченный код." }, { status: 400 });
    }

    if (row.attempts >= 5) {
      return NextResponse.json({ error: "Слишком много попыток. Запросите новый код." }, { status: 429 });
    }

    await prisma.sMSVerification.update({
      where: { id: row.id },
      data: { verifiedAt: new Date() },
    });

    if (session?.user?.id) {
      const taken = await prisma.user.findUnique({ where: { phone } });
      if (taken && taken.id !== session.user.id) {
        return NextResponse.json(
          { error: "Этот номер уже привязан к другому аккаунту." },
          { status: 409 },
        );
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone, phoneVerified: new Date() },
      });
    }

    return NextResponse.json({ ok: true, phone, verified: true });
  } catch (err) {
    console.error("[auth/sms/verify]", err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера." }, { status: 500 });
  }
}
