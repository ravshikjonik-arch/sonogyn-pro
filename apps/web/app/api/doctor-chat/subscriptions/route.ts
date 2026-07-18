import { NextResponse } from "next/server";
import { z } from "zod";

import { pilotChannelById } from "@/lib/chat/pilot-channels";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

const BodySchema = z.object({
  channelId: z.string().uuid(),
});

export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "doctor-chat-subscription", RL.syncBurst);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "doctor-chat-subscription", RL.syncBurst);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!pilotChannelById(parsed.data.channelId)) {
    return NextResponse.json({ error: "Unknown channel" }, { status: 400 });
  }

  const { data: existing, error: selectError } = await supabase
    .from("channel_subscriptions")
    .select("user_id")
    .eq("user_id", auth.userId)
    .eq("channel_id", parsed.data.channelId)
    .maybeSingle();

  if (selectError) {
    safeLog("channel subscription lookup error", { code: selectError.code, message: selectError.message });
    return NextResponse.json({ error: "Не удалось проверить подписку" }, { status: 500 });
  }

  if (existing) {
    const { error } = await supabase
      .from("channel_subscriptions")
      .delete()
      .eq("user_id", auth.userId)
      .eq("channel_id", parsed.data.channelId);

    if (error) {
      safeLog("channel subscription delete error", { code: error.code, message: error.message });
      return NextResponse.json({ error: "Не удалось отключить подписку" }, { status: 500 });
    }

    return NextResponse.json({ subscribed: false });
  }

  const { error } = await supabase
    .from("channel_subscriptions")
    .insert({ user_id: auth.userId, channel_id: parsed.data.channelId });

  if (error) {
    safeLog("channel subscription insert error", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Не удалось включить подписку" }, { status: 500 });
  }

  return NextResponse.json({ subscribed: true });
}
