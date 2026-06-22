import { CreateOradsEventBodySchema } from "@repo/types";
import { NextResponse } from "next/server";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) {
    if (isDevSkipAuthEnabled()) {
      return NextResponse.json({ id: null, dev: true });
    }
    return auth.response;
  }

  const userKey = auth.userId;
  const rl = await consumeRateLimit(`ai-orads-events:${userKey}`, RL.aiOrads.limit, RL.aiOrads.windowMs);
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

  const parsed = CreateOradsEventBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  if (body.patientId && !isUuid(body.patientId)) {
    return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
  }
  if (body.studyId && !isUuid(body.studyId)) {
    return NextResponse.json({ error: "Invalid studyId" }, { status: 400 });
  }

  if (body.patientId) {
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", body.patientId)
      .eq("created_by", auth.userId)
      .maybeSingle();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
  }

  const userId = auth.userId;

  const row = {
    user_id: userId,
    patient_id: body.patientId ?? null,
    study_id: body.studyId ?? null,
    platform: body.platform,
    source_text: body.sourceText,
    extracted: body.extracted,
    hints: body.hints,
    unresolved_nodes: body.unresolvedNodes,
    ai_category_number: body.aiCategoryNumber,
    ai_complete_path: body.aiCompletePath ?? null,
    age_years: body.ageYears ?? null,
    age_source: body.ageSource ?? null,
    menopause: body.menopause ?? null,
    menopause_source: body.menopauseSource ?? null,
    protocol_draft: body.protocolDraft ?? null,
    protocol_draft_source: body.protocolDraftSource ?? "none",
  };

  const { data, error } = await supabase.from("ai_orads_events").insert(row).select("id").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: Request) {
  return NextResponse.json({ error: "Use /api/ai/orads-events/[eventId]/feedback" }, { status: 405 });
}
