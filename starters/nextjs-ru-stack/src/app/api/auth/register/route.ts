import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { notifyTelegram } from "@/lib/telegram/notify";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

/** POST /api/auth/register — email + пароль (fallback без Google). */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        passwordHash,
      },
    });

    await notifyTelegram({
      event: "user.registered",
      userId: user.id,
      payload: { email, name: user.name },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
