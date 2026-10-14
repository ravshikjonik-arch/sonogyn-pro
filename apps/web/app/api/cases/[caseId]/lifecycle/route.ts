import { NextResponse } from "next/server";
import { z } from "zod";

import { CaseLifecycleTransitionBodySchema } from "@repo/types";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({ caseId: z.string().uuid() });

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
  const parsed = CaseLifecycleTransitionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { action, confirmationMethod, confirmationMethodOther, confirmedDiagnosis, note } =
    parsed.data;

  if (action === "confirm" && !confirmationMethod) {
    return NextResponse.json({ error: "Укажите метод подтверждения." }, { status: 400 });
  }
  if (action === "confirm" && confirmationMethod === "other" && !confirmationMethodOther?.trim()) {
    return NextResponse.json({ error: "Укажите пояснение для метода «другое»." }, { status: 400 });
  }

  const { error } = await supabase.rpc("transition_case_lifecycle", {
    p_case_id: routeParams.data.caseId,
    p_action: action,
    p_confirmation_method: confirmationMethod ?? null,
    p_confirmation_method_other: confirmationMethodOther ?? null,
    p_confirmed_diagnosis: confirmedDiagnosis ?? null,
    p_note: note ?? null,
  });

  if (error) {
    safeLog("case lifecycle transition error", { code: error.code, message: error.message });
    const status = error.message.includes("forbidden") ? 403 : 400;
    return NextResponse.json(
      { error: error.message.includes("invalid transition") ? "Недопустимый переход статуса" : "Не удалось изменить статус" },
      { status },
    );
  }

  return NextResponse.json({ ok: true, action });
}
