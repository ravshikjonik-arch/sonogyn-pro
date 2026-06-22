import { OradsEventFeedbackBodySchema } from "@repo/types";
import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

type Params = { eventId: string };

export async function PATCH(request: Request, context: { params: Promise<Params> }) {
  const { eventId } = await context.params;
  if (!isUuid(eventId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) {
    if (isDevSkipAuthEnabled()) {
      return NextResponse.json({ ok: true, id: null, dev: true });
    }
    return auth.response;
  }

  const userKey = auth.userId;
  const rl = await consumeRateLimit(`ai-orads-feedback:${userKey}`, RL.aiOrads.limit, RL.aiOrads.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = OradsEventFeedbackBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!parsed.data.feedbackCorrect && parsed.data.manualCategoryNumber === undefined) {
    return NextResponse.json(
      { error: "manualCategoryNumber required when feedbackCorrect is false" },
      { status: 400 },
    );
  }

  const userId = auth.userId;
  const now = new Date().toISOString();

  const patch = {
    feedback_correct: parsed.data.feedbackCorrect,
    manual_category_number: parsed.data.manualCategoryNumber ?? null,
    feedback_note: parsed.data.feedbackNote ?? null,
    feedback_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("ai_orads_events")
    .update(patch)
    .eq("id", eventId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
