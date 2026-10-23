import { NextResponse } from "next/server";

import { MessengerReportBodySchema } from "@repo/types";

import { rejectUnlessDoctorChatV2Enabled } from "@/lib/messenger/guard-v2";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

/** Report a messenger message for moderation (one report per user per message). */
export async function POST(request: Request) {
  const disabled = rejectUnlessDoctorChatV2Enabled();
  if (disabled) return disabled;

  const limited = await rejectIfRateLimitedPreset(request, "messenger-report", RL.syncBurst);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "messenger-report", RL.syncBurst);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = MessengerReportBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { chatId, messageId, reason } = parsed.data;

  const { error } = await supabase.from("messenger_message_reports").insert({
    chat_id: chatId,
    message_id: messageId,
    reporter_id: auth.userId,
    reason,
  });

  if (error) {
    safeLog("messenger report", { code: error.code });
    const status = error.code === "23505" ? 409 : 400;
    return NextResponse.json(
      { error: status === 409 ? "Вы уже отправляли жалобу на это сообщение" : "Не удалось отправить жалобу" },
      { status },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
