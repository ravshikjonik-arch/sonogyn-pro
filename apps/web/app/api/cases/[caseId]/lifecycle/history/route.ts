import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({ caseId: z.string().uuid() });

export async function GET(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-lifecycle-history", RL.casesListIp);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-lifecycle-history", RL.casesListUser);
  if (userRl) return userRl;

  const { data, error } = await supabase
    .from("case_lifecycle_events")
    .select("id,case_id,from_status,to_status,actor_id,note,meta,created_at")
    .eq("case_id", routeParams.data.caseId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ events: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    events: (data ?? []).map((row) => ({
      id: row.id,
      caseId: row.case_id,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      actorId: row.actor_id,
      note: row.note,
      meta: row.meta,
      createdAt: row.created_at,
    })),
  });
}
