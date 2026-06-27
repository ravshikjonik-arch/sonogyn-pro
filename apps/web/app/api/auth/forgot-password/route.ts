import { NextResponse } from "next/server";

import { recoveryResetPath } from "@/lib/auth/auth-callback";
import { PASSWORD_RESET_GENERIC_MSG } from "@/lib/auth/safe-auth-messages";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { ForgotPasswordBodySchema, parseJsonBody, zodErrorResponse } from "@/lib/security/api-body-schemas";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

function recoveryRedirectTo(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const origin = configured ? configured.replace(/\/$/, "") : new URL(request.url).origin;
  const next = encodeURIComponent(recoveryResetPath());
  return `${origin}/auth/callback?next=${next}`;
}

/** Server-side reset email — PKCE verifier в HttpOnly cookies (не в localStorage). */
export async function POST(request: Request) {
  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(request, "auth-forgot-password"),
    RL.authSignUp.limit,
    RL.authSignUp.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { ok: true, message: PASSWORD_RESET_GENERIC_MSG },
      { status: 200, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const raw = await parseJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = ForgotPasswordBodySchema.safeParse(raw.data);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const email = parsed.data.email;

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { supabase, cookiesToSet } = client;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: recoveryRedirectTo(request),
  });

  if (error) {
    console.error("[auth/forgot-password]", error.message);
  }

  return nextJsonWithAuthCookies({ ok: true, message: PASSWORD_RESET_GENERIC_MSG }, cookiesToSet);
}
