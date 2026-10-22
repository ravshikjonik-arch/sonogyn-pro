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
  vote: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export async function POST(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-vote", RL.syncBurst);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-vote", RL.syncBurst);
  if (userRl) return userRl;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("cast_case_vote", {
    p_case_id: routeParams.data.caseId,
    p_vote: parsed.data.vote,
  });

  if (error) {
    safeLog("case vote error", { code: error.code, message: error.message });
    const msg =
      error.message.includes("verified") || error.code === "42501"
        ? "Голосовать могут только врачи с подтверждённым статусом (✓)."
        : error.message;
    return NextResponse.json({ error: msg }, { status: error.code === "42501" ? 403 : 500 });
  }

  return NextResponse.json({ result: data });
}
