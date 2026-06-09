import { UpdatePatientBodySchema } from "@repo/types";
import { NextResponse } from "next/server";

import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

type Params = { patientId: string };

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { patientId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: patient, error } = await supabase
    .from("patients")
    .select("id,display_label,external_ref,meta,created_at,updated_at")
    .eq("id", patientId)
    .eq("created_by", user.id)
    .maybeSingle();

  if (error || !patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: studies } = await supabase
    .from("studies")
    .select("id,title,study_type,status,created_at")
    .eq("patient_id", patientId)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ patient, studies: studies ?? [] });
}

export async function PATCH(request: Request, context: { params: Promise<Params> }) {
  const { patientId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = UpdatePatientBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.display_label !== undefined) patch.display_label = parsed.data.display_label;
  if (parsed.data.external_ref !== undefined) patch.external_ref = parsed.data.external_ref;
  if (parsed.data.meta !== undefined) patch.meta = parsed.data.meta;

  const { data, error } = await supabase
    .from("patients")
    .update(patch)
    .eq("id", patientId)
    .eq("created_by", user.id)
    .select("id,display_label,external_ref,meta,created_at,updated_at")
    .single();

  if (error) {
    safeLog("patient update error", { code: error.code });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ patient: data });
}

export async function DELETE(_request: Request, context: { params: Promise<Params> }) {
  const { patientId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", patientId)
    .eq("created_by", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
