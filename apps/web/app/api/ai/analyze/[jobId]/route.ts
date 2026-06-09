import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const ParamsSchema = z.object({
  jobId: z.string().uuid(),
});

/** Poll-friendly status endpoint — app-level case ownership check (defense-in-depth). */
export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: params.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: analysis, error } = await supabase
    .from("ai_analyses")
    .select("id, case_id, status, results, error_message, requested_at, completed_at")
    .eq("id", params.data.jobId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: ownedCase } = await supabase
    .from("cases")
    .select("id")
    .eq("id", analysis.case_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ownedCase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ analysis });
}
