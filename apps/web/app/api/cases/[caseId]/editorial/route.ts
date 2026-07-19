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
  is_rare: z.boolean(),
  rare_slot: z.enum(["week", "month", "dont_miss"]).nullable(),
  editorial_priority: z.number().int().min(0).max(100),
});

export async function PATCH(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-editorial", RL.syncBurst);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-editorial", RL.syncBurst);
  if (userRl) return userRl;

  const roleGate = await requireModeratorRole(supabase, auth.userId);
  if (!roleGate.ok) return roleGate.response;

  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await supabase
    .from("cases")
    .update({
      is_rare: parsed.data.is_rare,
      rare_slot: parsed.data.rare_slot,
      editorial_priority: parsed.data.editorial_priority,
    })
    .eq("id", routeParams.data.caseId);

  if (error) {
    safeLog("case editorial error", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Не удалось сохранить editorial-разметку" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
