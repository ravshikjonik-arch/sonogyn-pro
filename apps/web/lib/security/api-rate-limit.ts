import { NextResponse } from "next/server";

import type { RateLimitPreset } from "@/lib/security/rate-limit-config";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

function rateLimitedResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: "Слишком много запросов. Подождите." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

/** Returns 429 response or null if allowed. */
export async function rejectIfRateLimited(
  request: Request,
  routeKey: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const rl = await consumeRateLimit(rateLimitKeyFromRequest(request, routeKey), limit, windowMs);
  if (rl.ok) return null;
  return rateLimitedResponse(rl.retryAfterSec);
}

export async function rejectIfRateLimitedPreset(
  request: Request,
  routeKey: string,
  preset: RateLimitPreset,
): Promise<NextResponse | null> {
  return rejectIfRateLimited(request, routeKey, preset.limit, preset.windowMs);
}

/** Per authenticated user (scraping with stolen session). */
export async function rejectIfRateLimitedForUser(
  userId: string,
  routeKey: string,
  preset: RateLimitPreset,
): Promise<NextResponse | null> {
  const rl = await consumeRateLimit(`${routeKey}:user:${userId}`, preset.limit, preset.windowMs);
  if (rl.ok) return null;
  return rateLimitedResponse(rl.retryAfterSec);
}
