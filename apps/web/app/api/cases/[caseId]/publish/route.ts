import { NextResponse } from "next/server";
import { z } from "zod";

import { canPublishCaseMedia, formatPublishBlockedError } from "@/lib/cases/anonymization-gate";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({
  caseId: z.string().uuid(),
});

export async function POST(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-publish", RL.syncBurst);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-publish", RL.syncBurst);
  if (userRl) return userRl;

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id,user_id")
    .eq("id", routeParams.data.caseId)
    .maybeSingle();

  if (caseError || !caseRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (caseRow.user_id !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: mediaRows, error: mediaError } = await supabase
    .from("case_media")
    .select("anonymization_status")
    .eq("case_id", routeParams.data.caseId);

  if (mediaError) {
    safeLog("case publish media gate error", { code: mediaError.code, message: mediaError.message });
    return NextResponse.json({ error: "Не удалось проверить медиа перед публикацией" }, { status: 500 });
  }

  const gate = canPublishCaseMedia(mediaRows ?? []);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason ?? "Подтвердите анонимизацию всех файлов" }, { status: 400 });
  }

  const { error } = await supabase
    .from("cases")
    .update({ status: "published", is_public: true })
    .eq("id", routeParams.data.caseId)
    .eq("user_id", auth.userId);

  if (error) {
    safeLog("case publish error", { code: error.code, message: error.message });
    return NextResponse.json({ error: formatPublishBlockedError(error.message) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
