import { NextResponse } from "next/server";

import {
  GYN_US_10_TOOL_ID,
  ProtocolDraftStateSchema,
  UpsertGynUs10DraftBodySchema,
} from "@repo/gynecology-ultrasound-10-steps";

import { getDoctorToolDraft, upsertDoctorToolDraft } from "@/lib/doctor-tool-drafts/service";
import { rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "doctor-tool-draft-read", RL.protocolRead);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  try {
    const row = await getDoctorToolDraft(supabase, auth.userId, GYN_US_10_TOOL_ID);
    if (!row) {
      return NextResponse.json({ draft: null });
    }
    const stateParsed = ProtocolDraftStateSchema.safeParse(row.state_json);
    return NextResponse.json({
      draft: stateParsed.success ? stateParsed.data : null,
      updatedAt: row.updated_at,
      lifecycleStatus: row.lifecycle_status,
      previewText: row.preview_text,
      schemaVersion: row.schema_version,
    });
  } catch (err) {
    safeLog("gyn-us-10 draft get error", { message: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ error: "Не удалось загрузить черновик" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "doctor-tool-draft-write", RL.protocolWrite);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpsertGynUs10DraftBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await getDoctorToolDraft(supabase, auth.userId, GYN_US_10_TOOL_ID);
  if (existing?.lifecycle_status === "finalized" && parsed.data.lifecycleStatus !== "archived") {
    return NextResponse.json(
      { error: "Черновик финализирован. Создайте новый или переведите в архив." },
      { status: 409 },
    );
  }

  try {
    const result = await upsertDoctorToolDraft(supabase, {
      userId: auth.userId,
      toolId: GYN_US_10_TOOL_ID,
      state: parsed.data.state,
      schemaVersion: parsed.data.state.schemaVersion,
      previewText: parsed.data.previewText ?? "",
      lifecycleStatus: parsed.data.lifecycleStatus ?? "draft",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    safeLog("gyn-us-10 draft put error", { message: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ error: "Не удалось сохранить черновик" }, { status: 500 });
  }
}
