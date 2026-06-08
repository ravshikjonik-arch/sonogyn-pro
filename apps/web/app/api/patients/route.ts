import { CreatePatientBodySchema } from "@repo/types";
import { NextResponse } from "next/server";

import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  let query = supabase
    .from("patients")
    .select("id,display_label,external_ref,meta,created_at,updated_at")
    .eq("created_by", user.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (q.length > 0) {
    query = query.ilike("display_label", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    safeLog("patients list error", { code: error.code });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ patients: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = CreatePatientBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { display_label, external_ref, meta } = parsed.data;

  const { data, error } = await supabase
    .from("patients")
    .insert({
      display_label,
      external_ref: external_ref ?? null,
      meta: meta ?? {},
      created_by: user.id,
    })
    .select("id,display_label,external_ref,meta,created_at,updated_at")
    .single();

  if (error) {
    safeLog("patient create error", { code: error.code });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ patient: data }, { status: 201 });
}
