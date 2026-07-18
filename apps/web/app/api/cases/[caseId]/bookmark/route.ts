import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({
  caseId: z.string().uuid(),
});

const BodySchema = z.object({
  active: z.boolean(),
});

export async function POST(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-bookmark", RL.syncBurst);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-bookmark", RL.syncBurst);
  if (userRl) return userRl;

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id")
    .eq("id", routeParams.data.caseId)
    .maybeSingle();

  if (caseError || !caseRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const query = supabase.from("teaching_case_bookmarks");
  const { error } = parsed.data.active
    ? await query.upsert({ case_id: routeParams.data.caseId, user_id: auth.userId }, { onConflict: "case_id,user_id" })
    : await query.delete().eq("case_id", routeParams.data.caseId).eq("user_id", auth.userId);

  if (error) {
    safeLog("case bookmark error", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Не удалось сохранить закладку" }, { status: 500 });
  }

  return NextResponse.json({ active: parsed.data.active });
}
