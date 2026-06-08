import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/copilot/audit";
import type { StudyType } from "@/lib/copilot/types";
import { createClient } from "@/utils/supabase/server";

const STUDY_TYPES = new Set<string>([
  "ob_gyn_general",
  "ob_fetal",
  "ob_doppler",
  "gyn_pelvic",
  "gyn_ovarian",
  "gyn_endometrial",
  "cervix",
  "placenta",
  "iugr_workup",
  "other",
]);

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("studies")
    .select("id,title,study_type,status,created_at,patient_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ studies: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const title =
    typeof body?.title === "string" && body.title.trim().length > 0
      ? body.title.trim().slice(0, 200)
      : null;

  const rawType = typeof body?.studyType === "string" ? body.studyType : "";
  const studyType = (
    STUDY_TYPES.has(rawType) ? rawType : "ob_gyn_general"
  ) as StudyType;

  const patientDisplayLabel =
    typeof body?.patientDisplayLabel === "string" &&
    body.patientDisplayLabel.trim().length > 0
      ? body.patientDisplayLabel.trim().slice(0, 200)
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
