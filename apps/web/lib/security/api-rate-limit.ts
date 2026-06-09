import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

/** Returns 429 response or null if allowed. */
export async function rejectIfRateLimited(
  request: Request,
  routeKey: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const rl = await consumeRateLimit(rateLimitKeyFromRequest(request, routeKey), limit, windowMs);
  if (rl.ok) return null;
  return NextResponse.json(
    { error: "Слишком много запросов. Подождите." },
    { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
  );
}
