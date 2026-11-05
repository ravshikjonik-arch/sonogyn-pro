import { NextResponse } from "next/server";

import { consumeRateLimit, type RateLimitResult } from "@/lib/security/rate-limit";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

export type RateLimitConfig = {
  /** Logical bucket name (included in Redis key). */
  name: string;
  limit: number;
  windowMs: number;
  /** Override key (e.g. user id). Default: IP-derived from request. */
  key?: string;
};

/**
 * SECURITY: reusable rate-limit gate for Route Handlers.
 * Returns 429 + Retry-After when exceeded; otherwise null (caller continues).
 */
export async function enforceRateLimit(
  request: Request,
  config: RateLimitConfig,
): Promise<NextResponse | null> {
  const key = config.key ?? rateLimitKeyFromRequest(request, config.name);
  const result: RateLimitResult = await consumeRateLimit(key, config.limit, config.windowMs);
  if (result.ok) return null;
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } },
  );
}

type RouteHandler = (request: Request, context?: unknown) => Promise<Response> | Response;

/**
 * Wrap a route handler with IP rate limiting.
 * SECURITY: prefer per-route presets from RL.*; use this for consistent 429 shape.
 */
export function withRateLimit(handler: RouteHandler, config: RateLimitConfig): RouteHandler {
  return async (request, context) => {
    const blocked = await enforceRateLimit(request, config);
    if (blocked) return blocked;
    return handler(request, context);
  };
}
