import { NextResponse } from "next/server";

import { rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { createClient } from "@/utils/supabase/server";

type Params = { patientId: string };

export async function GET(request: Request, context: { params: Promise<Params> }) {
  const limited = await rejectIfRateLimitedPreset(request, "patients-studies-list", RL.patientsDetail);
  if (limited) return limited;

  const { patientId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("created_by", user.id)
    .maybeSingle();

  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: studies, error } = await supabase
    .from("studies")
    .select("id,title,study_type,created_at")
    .eq("patient_id", patientId)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ studies: studies ?? [] });
}
