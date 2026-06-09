import { UltrasoundProtocolPayloadSchema } from "@repo/types";
import { NextResponse } from "next/server";

import { safeLog } from "@/lib/security/safeLog";
import { assertStudyOwnedByUser } from "@/lib/security/assert-study-owner";
import { createClient } from "@/utils/supabase/server";

type Params = { studyId: string };

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { studyId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owned = await assertStudyOwnedByUser(supabase, studyId, user.id);
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("measurements")
    .select("id,payload,created_at")
    .eq("study_id", studyId)
    .eq("kind", "ultrasound_protocol")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ protocol: data?.payload ?? null, measurementId: data?.id ?? null });
}

export async function PUT(request: Request, context: { params: Promise<Params> }) {
  const { studyId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owned = await assertStudyOwnedByUser(supabase, studyId, user.id);
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = UltrasoundProtocolPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("measurements")
    .select("id")
    .eq("study_id", studyId)
    .eq("kind", "ultrasound_protocol")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let measurementId: string;

  if (existing?.id) {
    const { error } = await supabase
      .from("measurements")
      .update({ payload: parsed.data })
      .eq("id", existing.id);
    if (error) {
      safeLog("protocol update error", { code: error.code });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    measurementId = existing.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("measurements")
      .insert({
        study_id: studyId,
        kind: "ultrasound_protocol",
        payload: parsed.data,
        source: "manual",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 400 });
    }
    measurementId = inserted.id;
  }

  await supabase
    .from("studies")
    .update({
      meta: { last_protocol_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq("id", studyId);

  return NextResponse.json({ ok: true, measurementId, protocol: parsed.data });
}
