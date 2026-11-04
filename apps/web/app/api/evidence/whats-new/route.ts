import { NextResponse } from "next/server";

import { listWhatsNewFeed } from "@repo/evidence-retrieval";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserOrOpenAccess } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/** GET /api/evidence/whats-new — лента обновлений КР / исследований / безопасности. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserOrOpenAccess(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `evidence-whats-new:${auth.userId}`,
    RL.evidenceSearch.limit,
    RL.evidenceSearch.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const items = listWhatsNewFeed();
  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    items,
  });
}
