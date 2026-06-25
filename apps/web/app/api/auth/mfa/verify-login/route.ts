import { NextResponse } from "next/server";

import { toSafeAuthErrorMessage } from "@/lib/auth/safe-auth-messages";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import {
  MfaVerifyLoginBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

/** Завершение входа при включённом TOTP (после sign-in с needsMfa). */
export async function POST(req: Request) {
  const raw = await parseJsonBody(req);
  if (!raw.ok) return raw.response;

  const parsed = MfaVerifyLoginBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const body = parsed.data;
  const factorId = body.factorId;
  const code = body.code;

  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(req, "auth-mfa-verify"),
    RL.authMfaVerify.limit,
    RL.authMfaVerify.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
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
