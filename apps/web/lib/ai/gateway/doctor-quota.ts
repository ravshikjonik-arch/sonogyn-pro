import { createClient } from "@supabase/supabase-js";

import { assertAiChatQuota } from "@/lib/ai/sonogyn-chat/cost-control";
import { hasProEntitlement } from "@/lib/subscription/access";

import { doctorDailyRequestLimit, doctorDailyUsdLimit } from "./cost";

export type GatewayQuotaResult =
  | { ok: true; isPro: true }
  | { ok: true; isPro: false; usedRequests: number; requestLimit: number; usedUsd: number; usdLimit: number }
  | {
      ok: false;
      reason: "monthly_chat" | "daily_requests" | "daily_usd";
      usedRequests: number;
      requestLimit: number;
      usedUsd: number;
      usdLimit: number;
      monthlyUsed?: number;
      monthlyLimit?: number;
    };

/**
 * Per-doctor limits for gateway-backed AI (Evidence / chat).
 * Pro: bypass daily $ and daily request caps (monthly chat quota already bypassed).
 */
export async function assertAiGatewayQuota(userId: string): Promise<GatewayQuotaResult> {
  const monthly = await assertAiChatQuota(userId);
  if (!monthly.ok) {
    return {
      ok: false,
      reason: "monthly_chat",
      usedRequests: 0,
      requestLimit: doctorDailyRequestLimit(),
      usedUsd: 0,
      usdLimit: doctorDailyUsdLimit(),
      monthlyUsed: monthly.used,
      monthlyLimit: monthly.limit,
    };
  }
  if (monthly.isPro) return { ok: true, isPro: true };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  // Defense in depth: free daily counters also require service role (A6).
  if (!url || !key) {
    return {
      ok: false,
      reason: "monthly_chat",
      usedRequests: 0,
      requestLimit: doctorDailyRequestLimit(),
      usedUsd: 0,
      usdLimit: doctorDailyUsdLimit(),
      monthlyUsed: monthly.used,
      monthlyLimit: monthly.limit,
    };
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const { data: rows } = await admin
    .from("ai_chat_events")
    .select("estimated_cost_usd")
    .eq("user_id", userId)
    .eq("success", true)
    .gte("created_at", dayStart.toISOString());

  const usedRequests = rows?.length ?? 0;
  const usedUsd = Number(
    (rows ?? [])
      .reduce((sum, r) => sum + (typeof r.estimated_cost_usd === "number" ? r.estimated_cost_usd : 0), 0)
      .toFixed(6),
  );
  const requestLimit = doctorDailyRequestLimit();
  const usdLimit = doctorDailyUsdLimit();

  if (usedRequests >= requestLimit) {
    return { ok: false, reason: "daily_requests", usedRequests, requestLimit, usedUsd, usdLimit };
  }
  if (usdLimit > 0 && usedUsd >= usdLimit) {
    return { ok: false, reason: "daily_usd", usedRequests, requestLimit, usedUsd, usdLimit };
  }

  // Double-check profile still free (race with upgrade)
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_tier, trial_ends_at")
    .eq("id", userId)
    .maybeSingle();
  if (
    profile &&
    hasProEntitlement({
      subscription_tier: profile.subscription_tier ?? "free",
      trial_ends_at: profile.trial_ends_at ?? null,
    })
  ) {
    return { ok: true, isPro: true };
  }

  return { ok: true, isPro: false, usedRequests, requestLimit, usedUsd, usdLimit };
}
