import { NextResponse } from "next/server";

import { MessengerAiSuggestBodySchema } from "@repo/types";

import { suggestMessengerCommunityAiReply } from "@/lib/messenger/ai/messenger-community-tutor";
import { isDoctorChatAiMentionEnabled } from "@/lib/chat/flags";
import { rejectUnlessDoctorChatV2Enabled } from "@/lib/messenger/guard-v2";
import { rejectIfPhiInTextFields } from "@/lib/security/reject-phi-payload";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

const DISCLAIMER =
  "Подсказка ИИ для обучения. Не диагноз — интерпретация и тактика определяются специалистом.";

/** Tutor hint for @AI mentions in doctor chat (does not post to channel). */
export async function POST(request: Request) {
  const disabled = rejectUnlessDoctorChatV2Enabled();
  if (disabled) return disabled;

  if (!isDoctorChatAiMentionEnabled()) {
    return NextResponse.json({ error: "AI mentions disabled" }, { status: 404 });
  }

  const limited = await rejectIfRateLimitedPreset(request, "messenger-ai-suggest", RL.aiTutor);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "messenger-ai-suggest", RL.aiTutor);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = MessengerAiSuggestBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const phiBlocked = rejectIfPhiInTextFields([parsed.data.prompt]);
  if (phiBlocked) return phiBlocked;

  const { data: chatRow, error: chatErr } = await supabase
    .from("messenger_chats")
    .select("id")
    .eq("id", parsed.data.chatId)
    .maybeSingle();

  if (chatErr || !chatRow) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  try {
    const suggestion = await suggestMessengerCommunityAiReply(parsed.data.prompt);
    return NextResponse.json({
      suggestion,
      disclaimer: DISCLAIMER,
    });
  } catch (err) {
    safeLog("messenger ai suggest", { message: err instanceof Error ? err.message : "failed" });
    return NextResponse.json({ error: "Не удалось получить подсказку ИИ" }, { status: 502 });
  }
}
