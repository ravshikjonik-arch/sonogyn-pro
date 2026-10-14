import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({ caseId: z.string().uuid() });
const BodySchema = z.object({
  lastReadCommentId: z.string().uuid().optional(),
});

export async function GET(request: Request, { params }: Params) {
  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const { data: cursor } = await supabase
    .from("case_discussion_read_cursors")
    .select("last_read_at,last_read_comment_id")
    .eq("case_id", routeParams.data.caseId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  const since = cursor?.last_read_at ?? new Date(0).toISOString();

  const { count } = await supabase
    .from("teaching_case_comments")
    .select("id", { count: "exact", head: true })
    .eq("case_id", routeParams.data.caseId)
    .gt("created_at", since);

  return NextResponse.json({
    unreadCount: count ?? 0,
    lastReadAt: cursor?.last_read_at ?? null,
  });
}

export async function PUT(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-read-cursor", RL.casesListIp);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-read-cursor", RL.casesListUser);
  if (userRl) return userRl;

  const json = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);

  const { error } = await supabase.from("case_discussion_read_cursors").upsert({
    user_id: auth.userId,
    case_id: routeParams.data.caseId,
    last_read_at: new Date().toISOString(),
    last_read_comment_id: parsed.success ? parsed.data.lastReadCommentId ?? null : null,
  });

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ ok: true, degraded: true });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, unreadCount: 0 });
}
