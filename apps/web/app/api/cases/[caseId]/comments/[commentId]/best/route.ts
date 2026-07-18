import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string; commentId: string }> };

const ParamsSchema = z.object({
  caseId: z.string().uuid(),
  commentId: z.string().uuid(),
});

export async function POST(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-comment-best", RL.syncBurst);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-comment-best", RL.syncBurst);
  if (userRl) return userRl;

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("user_id")
    .eq("id", routeParams.data.caseId)
    .maybeSingle();

  if (caseError || !caseRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (caseRow.user_id !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.rpc("mark_best_comment", {
    p_case_id: routeParams.data.caseId,
    p_comment_id: routeParams.data.commentId,
  });

  if (error) {
    safeLog("case comment best error", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Не удалось отметить лучший ответ" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
