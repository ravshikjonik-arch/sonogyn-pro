import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";
import { resolveDataSupabaseClient } from "@/utils/supabase/user-scoped";

export const runtime = "nodejs";

const ParamsSchema = z.object({
  jobId: z.string().uuid(),
});

/** Poll-friendly status endpoint — app-level case ownership check (defense-in-depth). */
export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: params.error.flatten() }, { status: 400 });
  }

  const cookieClient = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, cookieClient);
  if (!auth.ok) return auth.response;

  const supabase = resolveDataSupabaseClient(request, cookieClient);

  const pollRl = await consumeRateLimit(
    `ai-analyze-poll:${auth.userId}`,
    RL.aiAnalyzePoll.limit,
    RL.aiAnalyzePoll.windowMs,
  );
  if (!pollRl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(pollRl.retryAfterSec) } },
    );
  }

  const { data: analysis, error } = await supabase
    .from("ai_analyses")
    .select("id, case_id, status, results, error_message, requested_at, completed_at")
    .eq("id", params.data.jobId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: ownedCase } = await supabase
    .from("cases")
    .select("id")
    .eq("id", analysis.case_id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!ownedCase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ analysis });
}
