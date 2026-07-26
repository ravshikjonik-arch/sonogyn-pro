import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

/**
 * Read-only history of the user's Evidence Assistant queries (evidence_query_log).
 * RLS: select own rows only.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `evidence-history:${auth.userId}`,
    RL.evidenceBookmarks.limit,
    RL.evidenceBookmarks.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный limit" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("evidence_query_log")
    .select("id, query, sources, result_count, synthesis_mode, evidence_strength, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(parsed.data.limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    history: data ?? [],
    rateLimitHint: {
      assistantLimit: RL.evidenceAssistant.limit,
      assistantWindowSec: Math.round(RL.evidenceAssistant.windowMs / 1000),
    },
  });
}
