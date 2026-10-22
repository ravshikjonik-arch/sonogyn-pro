import { NextResponse } from "next/server";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { requireModeratorRole } from "@/lib/security/require-clinical-role";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-log";
import { safeLog } from "@/lib/security/safeLog";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(_request, "case-featured", RL.syncBurst);
  if (limited) return limited;

  const { caseId } = await params;
  if (!isUuid(caseId)) {
    return NextResponse.json({ error: "Invalid case id" }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(_request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-featured", RL.syncBurst);
  if (userRl) return userRl;

  const modGate = await requireModeratorRole(supabase, auth.userId);
  if (!modGate.ok) return modGate.response;

  await writeSecurityAuditLog({
    category: "moderation",
    action: "case.featured_reputation",
    resource: caseId,
  });

  const { error } = await supabase.rpc("award_case_featured", { p_case_id: caseId });

  if (error) {
    safeLog("award_case_featured error", { code: error.code, message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
