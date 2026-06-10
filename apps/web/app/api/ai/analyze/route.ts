import { after } from "next/server";
import { NextResponse } from "next/server";

import { AiAnalyzeRequestSchema } from "@repo/types";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { hasProEntitlement } from "@/lib/subscription/access";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

const MOCK_DELAY_MS = 30_000;

/**
 * Queues a mocked asynchronous AI segmentation job (HTTP 202). Completion is written via service role after response flush.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AiAnalyzeRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `ai-analyze:${auth.userId}`,
    RL.aiAnalyze.limit,
    RL.aiAnalyze.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("subscription_tier, trial_ends_at")
    .eq("id", auth.userId)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json({ error: profileErr?.message ?? "Profile missing" }, { status: 500 });
  }

  if (
    !hasProEntitlement({
      subscription_tier: profile.subscription_tier as string,
      trial_ends_at: profile.trial_ends_at as string | null,
    })
  ) {
    return NextResponse.json({ error: "PRO subscription required" }, { status: 402 });
  }

  const { data: ownedCase, error: caseErr } = await supabase
    .from("cases")
    .select("id")
    .eq("id", parsed.data.caseId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (caseErr || !ownedCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const { data: mediaRows, error: mediaErr } = await supabase
    .from("case_media")
    .select("id")
    .eq("case_id", parsed.data.caseId)
    .in("id", parsed.data.mediaIds);

  if (mediaErr) {
    return NextResponse.json({ error: mediaErr.message }, { status: 500 });
  }

  if (!mediaRows || mediaRows.length !== parsed.data.mediaIds.length) {
    return NextResponse.json({ error: "One or more media ids are invalid for this case" }, { status: 400 });
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("ai_analyses")
    .insert({
      case_id: parsed.data.caseId,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !inserted?.id) {
    return NextResponse.json({ error: insertErr?.message ?? "Insert failed" }, { status: 500 });
  }

  const jobId = inserted.id as string;

  after(async () => {
    const admin = createServiceRoleClient();
    await admin.from("ai_analyses").update({ status: "processing" }).eq("id", jobId);
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    const completedAt = new Date().toISOString();
    await admin
      .from("ai_analyses")
      .update({
        status: "completed",
        completed_at: completedAt,
        results: {
          mock: true,
          modelVersion: "mock-v1",
          overlays: [
            {
              type: "bbox",
              xNorm: 0.12,
              yNorm: 0.18,
              widthNorm: 0.42,
              heightNorm: 0.31,
              labelKey: "roi.ultrasound.region",
            },
          ],
          measurementsMm: { longestAxis: 42 },
          mediaIds: parsed.data.mediaIds,
        },
      })
      .eq("id", jobId);
  });

  return NextResponse.json({ accepted: true, jobId, pollAfterMs: 2000 }, { status: 202 });
}
