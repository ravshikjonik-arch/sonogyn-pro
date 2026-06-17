import { NextResponse } from "next/server";

import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";

/** Server-validated user for HttpOnly cookie sessions (client JS не читает refresh). */
export async function GET(request: Request) {
  const rl = await consumeAuthRateLimit(
    rateLimitKeyFromRequest(request, "auth-session"),
    RL.authSession.limit,
    RL.authSession.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { user: null, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ user: null }, { status: client.status });
  }

  const {
    data: { user },
    error,
  } = await client.supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
    },
  });
}
