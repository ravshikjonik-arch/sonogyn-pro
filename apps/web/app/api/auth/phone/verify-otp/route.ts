import { NextResponse } from "next/server";

import { isLikelySupabaseNetworkError } from "@/lib/auth-network-error";
import {
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/auth/auth-attempts";
import { toSafeAuthErrorMessage } from "@/lib/auth/safe-auth-messages";
import { normalizePhone } from "@/lib/auth/oauth-providers";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

type Body = {
  phone?: string;
  token?: string;
};

export async function POST(req: Request) {
  const failKey = rateLimitKeyFromRequest(req, "auth-phone-verify-fail");

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const rl = await consumeRateLimit(rateLimitKeyFromRequest(req, "auth-phone-verify"), 20, 15 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите и попробуйте снова." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!phone || !token) {
    return NextResponse.json({ error: "Укажите телефон и код." }, { status: 400 });
  }

  const wantsMobileSession = req.headers.get("x-sonogyn-client") === "mobile";

  try {
    const { error } = await client.supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error) {
      await recordAuthFailure(failKey);
      const net = isLikelySupabaseNetworkError(error.message);
      return NextResponse.json(
        { error: toSafeAuthErrorMessage(error.message, "otp") },
        { status: net ? 502 : 401 },
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordAuthFailure(failKey);
    return NextResponse.json({ error: toSafeAuthErrorMessage(msg, "otp") }, { status: 502 });
  }

  await clearAuthFailures(failKey);

  if (wantsMobileSession) {
    const { data: sessionData } = await client.supabase.auth.getSession();
    if (sessionData.session) {
      return NextResponse.json({
        ok: true,
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        },
      });
    }
  }

  return nextJsonWithAuthCookies({ ok: true }, client.cookiesToSet);
}