import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/auth/sms/verify — alias для /api/auth/phone/verify-otp.
 * Body: { "phone": "+79001234567", "code": "123456" }
 */
export async function POST(req: Request) {
  let body: { phone?: string; code?: string; createUser?: boolean; full_name?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const res = await fetch(`${origin}/api/auth/phone/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(req.headers.get("x-sonogyn-client")
        ? { "x-sonogyn-client": req.headers.get("x-sonogyn-client")! }
        : {}),
    },
    body: JSON.stringify({
      phone: body.phone,
      token: body.code,
      createUser: body.createUser,
      full_name: body.full_name,
    }),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
