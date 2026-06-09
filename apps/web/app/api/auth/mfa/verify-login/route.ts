import { NextResponse } from "next/server";

import { OTP_INVALID_MSG, toSafeAuthErrorMessage } from "@/lib/auth/safe-auth-messages";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

type Body = {
  factorId?: string;
  code?: string;
  session?: { access_token?: string; refresh_token?: string };
};

/** Завершение входа при включённом TOTP (после sign-in с needsMfa). */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const factorId = typeof body.factorId === "string" ? body.factorId.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!factorId || !code) {
    return NextResponse.json({ error: OTP_INVALID_MSG }, { status: 400 });
  }

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { supabase, cookiesToSet } = client;
  const wantsMobileSession = req.headers.get("x-sonogyn-client") === "mobile";

  if (
    wantsMobileSession &&
    body.session?.access_token &&
    body.session?.refresh_token
  ) {
    await supabase.auth.setSession({
      access_token: body.session.access_token,
      refresh_token: body.session.refresh_token,
    });
  }

  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) {
    return NextResponse.json(
      { error: toSafeAuthErrorMessage(challenge.error.message, "otp") },
      { status: 401 },
    );
  }

  const verified = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });

  if (verified.error) {
    return NextResponse.json(
      { error: toSafeAuthErrorMessage(verified.error.message, "otp") },
      { status: 401 },
    );
  }

  if (wantsMobileSession) {
    const { data: sessionData } = await supabase.auth.getSession();
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

  return nextJsonWithAuthCookies({ ok: true }, cookiesToSet);
}
