import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({ caseId: z.string().uuid() });

export async function POST(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-presence", RL.casesListIp);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-presence", RL.casesListUser);
  if (userRl) return userRl;

  const { error } = await supabase.from("case_discussion_presence").upsert({
    case_id: routeParams.data.caseId,
    user_id: auth.userId,
    last_seen_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ ok: true, degraded: true });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request, { params }: Params) {
  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const since = new Date(Date.now() - 60_000).toISOString();

  const { data, error } = await supabase
    .from("case_discussion_presence")
    .select("user_id,last_seen_at")
    .eq("case_id", routeParams.data.caseId)
    .gte("last_seen_at", since);

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ participants: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    participants: (data ?? []).map((row) => ({
      userId: row.user_id,
      lastSeenAt: row.last_seen_at,
    })),
  });
}
