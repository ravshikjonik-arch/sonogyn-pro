import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string; mediaId: string }> };

const ParamsSchema = z.object({
  caseId: z.string().uuid(),
  mediaId: z.string().uuid(),
});

const BodySchema = z.object({
  confirmed: z.literal(true),
});

export async function PATCH(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-media-anonymization", RL.syncBurst);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-media-anonymization", RL.syncBurst);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Подтвердите чеклист анонимизации" }, { status: 400 });
  }

  const { data: media, error: mediaError } = await supabase
    .from("case_media")
    .select("id,case_id")
    .eq("id", routeParams.data.mediaId)
    .eq("case_id", routeParams.data.caseId)
    .maybeSingle();

  if (mediaError || !media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

  const { error } = await supabase
    .from("case_media")
    .update({
      anonymization_status: "passed",
      anonymization_checked_at: new Date().toISOString(),
      anonymization_checked_by: auth.userId,
    })
    .eq("id", routeParams.data.mediaId)
    .eq("case_id", routeParams.data.caseId);

  if (error) {
    safeLog("case media anonymization error", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Не удалось подтвердить анонимизацию" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
