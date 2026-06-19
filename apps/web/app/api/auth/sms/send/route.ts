import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/auth/sms/send — alias для /api/auth/phone/send-otp.
 * Body: { "phone": "+79001234567" }
 */
export async function POST(req: Request) {
  let body: { phone?: string; createUser?: boolean; fallbackEmail?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const res = await fetch(`${origin}/api/auth/phone/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(req.headers.get("Idempotency-Key")
        ? { "Idempotency-Key": req.headers.get("Idempotency-Key")! }
        : {}),
    },
    body: JSON.stringify({
      phone: body.phone,
      createUser: body.createUser,
      fallbackEmail: body.fallbackEmail,
    }),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
