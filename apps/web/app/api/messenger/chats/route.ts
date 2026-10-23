import { NextResponse } from "next/server";

import { MessengerResolveChannelQuerySchema } from "@repo/types";

import { rejectUnlessDoctorChatV2Enabled } from "@/lib/messenger/guard-v2";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

/** Resolve v2 chat id for a legacy doctor_chat channel (creates row if missing). */
export async function GET(request: Request) {
  const disabled = rejectUnlessDoctorChatV2Enabled();
  if (disabled) return disabled;

  const limited = await rejectIfRateLimitedPreset(request, "messenger-chats", RL.casesListIp);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const parsed = MessengerResolveChannelQuerySchema.safeParse({
    legacyChannelId: searchParams.get("legacyChannelId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "messenger-chats", RL.casesListUser);
  if (userRl) return userRl;

  const { data: chatId, error } = await supabase.rpc("messenger_ensure_channel_chat", {
    p_legacy_channel_id: parsed.data.legacyChannelId,
  });

  if (error || !chatId) {
    safeLog("messenger ensure channel chat", { message: error?.message ?? "no id" });
    const hint = error?.message?.includes("messenger_")
      ? "Apply migration 20261023120000_doctor_messenger_v2.sql"
      : (error?.message ?? "Chat not found");
    return NextResponse.json({ error: hint }, { status: 500 });
  }

  return NextResponse.json({ chatId, legacyChannelId: parsed.data.legacyChannelId });
}
