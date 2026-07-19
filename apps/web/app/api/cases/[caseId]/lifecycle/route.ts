import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { requireModeratorRole } from "@/lib/security/require-clinical-role";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({
  caseId: z.string().uuid(),
});

const BodySchema = z.object({
  action: z.enum(["confirm", "resolve"]),
});

export async function PATCH(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-lifecycle", RL.syncBurst);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-lifecycle", RL.syncBurst);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.action === "confirm") {
    const roleGate = await requireModeratorRole(supabase, auth.userId);
    if (!roleGate.ok) return roleGate.response;

    const { error } = await supabase.rpc("confirm_teaching_case", {
      p_case_id: routeParams.data.caseId,
    });

    if (error) {
      safeLog("case confirm error", { code: error.code, message: error.message });
      const message =
        error.message.includes("schema cache") || error.code === "PGRST202"
          ? "RPC не в кэше — выполните BUNDLE_RPC_CONFIRM.sql в SQL Editor"
          : "Не удалось подтвердить кейс";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
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
    .from("cases")
    .update({ lifecycle_status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", routeParams.data.caseId)
    .eq("user_id", auth.userId);

  if (error) {
    safeLog("case resolve error", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Не удалось закрыть кейс" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
