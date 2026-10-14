import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({ caseId: z.string().uuid() });

export async function GET(request: Request, { params }: Params) {
  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const { data } = await supabase
    .from("case_subscriptions")
    .select("case_id")
    .eq("case_id", routeParams.data.caseId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  return NextResponse.json({ subscribed: Boolean(data) });
}

export async function POST(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-subscribe", RL.casesListIp);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const { error } = await supabase.from("case_subscriptions").upsert({
    user_id: auth.userId,
    case_id: routeParams.data.caseId,
  });

  if (error) {
    safeLog("case subscribe error", { code: error.code });
    return NextResponse.json({ error: "Не удалось подписаться" }, { status: 400 });
  }

  return NextResponse.json({ subscribed: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  await supabase
    .from("case_subscriptions")
    .delete()
    .eq("case_id", routeParams.data.caseId)
    .eq("user_id", auth.userId);

  return NextResponse.json({ subscribed: false });
}
