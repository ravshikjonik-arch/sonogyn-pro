import { NextResponse } from "next/server";

import { MessengerCaseCardQuerySchema } from "@repo/types";

import { rejectUnlessDoctorChatV2Enabled } from "@/lib/messenger/guard-v2";
import { rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

/** Teaching case preview for messenger clinical card embeds. */
export async function GET(request: Request) {
  const disabled = rejectUnlessDoctorChatV2Enabled();
  if (disabled) return disabled;

  const limited = await rejectIfRateLimitedPreset(request, "messenger-case-card", RL.casesListIp);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const parsed = MessengerCaseCardQuerySchema.safeParse({
    caseId: searchParams.get("caseId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabase
    .from("cases")
    .select("id,title,topic,lifecycle_status,channel_id")
    .eq("id", parsed.data.caseId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Кейс недоступен" }, { status: 404 });
  }

  return NextResponse.json({
    card: {
      id: data.id,
      title: data.title,
      topic: data.topic,
      lifecycleStatus: data.lifecycle_status,
      href: `/cases/${data.id}`,
    },
  });
}
