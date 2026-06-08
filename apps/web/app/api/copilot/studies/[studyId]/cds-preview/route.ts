import { NextResponse } from "next/server";
import { runClinicalCopilotOrchestrator } from "@/lib/ai/orchestrator";
import { createClient } from "@/utils/supabase/server";

type Params = { studyId: string };

export async function POST(
  _request: Request,
  context: { params: Promise<Params> },
) {
  const { studyId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: study, error } = await supabase
    .from("studies")
    .select("id")
    .eq("id", studyId)
    .maybeSingle();

  if (error || !study) {
    return NextResponse.json({ error: "Study not found" }, { status: 404 });
  }

  const result = await runClinicalCopilotOrchestrator({ studyId });

  return NextResponse.json({ cds: result });
}
