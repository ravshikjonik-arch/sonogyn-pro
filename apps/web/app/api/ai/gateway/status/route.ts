import { NextResponse } from "next/server";

import { getGatewayStatus } from "@/lib/ai/gateway";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Provider health / chain — no secrets in response. */
export async function GET(request: Request) {
  const rl = await consumeRateLimit(rateLimitKeyFromRequest(request, "ai-gateway-status"), 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const purposeParam = new URL(request.url).searchParams.get("purpose");
  const purpose =
    purposeParam === "vision" || purposeParam === "evidence" || purposeParam === "text"
      ? purposeParam
      : "text";

  const status = await getGatewayStatus(purpose);
  return NextResponse.json({
    ...status,
    disclaimer:
      "AI Gateway — маршрутизация Colibri / Perplexity / OpenRouter. Не диагноз; интерпретация — специалист.",
  });
}
