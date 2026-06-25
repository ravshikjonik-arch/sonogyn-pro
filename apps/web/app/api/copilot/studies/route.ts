import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/copilot/audit";
import type { StudyType } from "@/lib/copilot/types";
import {
  rejectIfRateLimitedPreset,
  rejectIfSyncBurstForUser,
} from "@/lib/security/api-rate-limit";
import {
  CopilotStudyCreateBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await consumeRateLimit(
    rateLimitKeyFromRequest(request, "copilot-studies-list"),
    RL.copilotStudiesList.limit,
    RL.copilotStudiesList.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Подождите." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const { data, error } = await supabase
    .from("studies")
    .select("id,title,study_type,status,created_at,patient_id")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ studies: data ?? [] });
}

export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "copilot-study-create", RL.copilotStudyCreate);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const burst = await rejectIfSyncBurstForUser(user.id);
  if (burst) return burst;

  const raw = await parseJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = CopilotStudyCreateBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const body = parsed.data;

  const title =
    body.title && body.title.length > 0 ? body.title : null;

  const studyType = (body.studyType ?? "ob_gyn_general") as StudyType;

  const patientDisplayLabel =
    body.patientDisplayLabel && body.patientDisplayLabel.length > 0
      ? body.patientDisplayLabel
      : null;

  let patientId: string | null = null;

  if (patientDisplayLabel) {
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert({
        display_label: patientDisplayLabel,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: patientError?.message ?? "Patient insert failed" },
        { status: 400 },
      );
    }

    patientId = patient.id;
  }

  const { data: study, error: studyError } = await supabase
    .from("studies")
    .insert({
      patient_id: patientId,
      study_type: studyType,
      title,
      created_by: user.id,
      status: "draft",
    })
    .select("*")
    .single();

  if (studyError || !study) {
    return NextResponse.json(
      { error: studyError?.message ?? "Study insert failed" },
      { status: 400 },
    );
  }

  await recordAuditEvent(supabase, {
    actorId: user.id,
    studyId: study.id,
    action: "study_created",
    entityType: "study",
    entityId: study.id,
    payload: { study_type: studyType },
  });

  return NextResponse.json({ study });
}
