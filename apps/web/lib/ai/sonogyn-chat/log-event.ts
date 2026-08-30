import { createClient } from "@supabase/supabase-js";

export type AiChatLogInput = {
  userId: string;
  domain: string;
  success: boolean;
  durationMs: number;
  model: string;
  errorCode?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  hasImages: boolean;
  promptVersion?: string | null;
  estimatedCostUsd?: number | null;
  sessionId?: string | null;
};

/** Метаданные запроса — без PHI и без base64 */
export async function logAiChatEvent(input: AiChatLogInput): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return;

  try {
    const admin = createClient(url, key, { auth: { persistSession: false } });
    await admin.from("ai_chat_events").insert({
      user_id: input.userId,
      domain: input.domain,
      success: input.success,
      duration_ms: input.durationMs,
      model: input.model,
      error_code: input.errorCode ?? null,
      prompt_tokens: input.promptTokens ?? null,
      completion_tokens: input.completionTokens ?? null,
      has_images: input.hasImages,
      prompt_version: input.promptVersion ?? null,
      estimated_cost_usd: input.estimatedCostUsd ?? null,
      session_id: input.sessionId ?? null,
    });
  } catch (e) {
    console.warn("[ai_chat_events] log failed", e);
  }
}
