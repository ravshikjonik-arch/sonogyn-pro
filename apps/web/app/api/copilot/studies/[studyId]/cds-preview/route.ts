import { NextResponse } from "next/server";
import { runClinicalCopilotOrchestrator } from "@/lib/ai/orchestrator";
import { rejectIfRateLimited } from "@/lib/security/api-rate-limit";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

type Params = { studyId: string };

export async function POST(
  request: Request,
  context: { params: Promise<Params> },
) {
  const limited = await rejectIfRateLimited(request, "copilot-cds-preview", 20, 60_000);
  if (limited) return limited;

  const { studyId } = await context.params;
  if (!isUuid(studyId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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
    .eq("created_by", user.id)
    .maybeSingle();

  if (error || !study) {
    return NextResponse.json({ error: "Study not found" }, { status: 404 });
  }

  const result = await runClinicalCopilotOrchestrator({ studyId });

  return NextResponse.json({ cds: result });
}
