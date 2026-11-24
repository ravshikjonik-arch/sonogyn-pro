import { NextResponse } from "next/server";

import { listWhatsNewFeed } from "@repo/evidence-retrieval";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

export const runtime = "nodejs";

/** GET /api/evidence/whats-new — public metadata feed (КР diff + curated links). */
export async function GET(request: Request) {
  const rlKey = rateLimitKeyFromRequest(request, "evidence-whats-new");
  const rl = await consumeRateLimit(rlKey, RL.evidenceSearch.limit, RL.evidenceSearch.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const items = listWhatsNewFeed();
  return NextResponse.json(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      items,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}