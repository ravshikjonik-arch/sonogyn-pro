import { createClient } from "@supabase/supabase-js";

import { FREE_AI_LIMIT } from "@/lib/pro/ai-usage";
import { hasProEntitlement } from "@/lib/subscription/access";

/** Rough USD estimate for cost telemetry (not billing). */
const COST_PER_1K_PROMPT = 0.00015;
const COST_PER_1K_COMPLETION = 0.0006;

export function estimateTokenCostUsd(
  promptTokens: number | null | undefined,
  completionTokens: number | null | undefined,
): number | null {
  if (promptTokens == null && completionTokens == null) return null;
  const p = (promptTokens ?? 0) / 1000;
  const c = (completionTokens ?? 0) / 1000;
  return Number((p * COST_PER_1K_PROMPT + c * COST_PER_1K_COMPLETION).toFixed(6));
}

export async function assertAiChatQuota(userId: string): Promise<
  | { ok: true; isPro: true }
  | { ok: true; isPro: false; used: number; limit: number }
  | { ok: false; used: number; limit: number }
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return { ok: true, isPro: true };
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_tier, trial_ends_at")
    .eq("id", userId)
    .maybeSingle();

  const isPro = profile
    ? hasProEntitlement({
        subscription_tier: profile.subscription_tier ?? "free",
        trial_ends_at: profile.trial_ends_at ?? null,
      })
    : false;

  if (isPro) return { ok: true, isPro: true };

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("ai_chat_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("success", true)
    .gte("created_at", since);

  const used = count ?? 0;
  if (used >= FREE_AI_LIMIT) {
    return { ok: false, used, limit: FREE_AI_LIMIT };
  }
  return { ok: true, isPro: false, used, limit: FREE_AI_LIMIT };
}
