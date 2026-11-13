import type { GatewayProviderId, GatewayUsage } from "./types";

/** Rough USD / 1k tokens — telemetry only, not billing. */
const RATES: Record<
  GatewayProviderId,
  { prompt: number; completion: number }
> = {
  colibri: { prompt: 0, completion: 0 },
  perplexity: { prompt: 0.003, completion: 0.015 },
  openrouter: { prompt: 0.00015, completion: 0.0006 },
};

export function estimateGatewayCostUsd(
  provider: GatewayProviderId,
  promptTokens: number | null | undefined,
  completionTokens: number | null | undefined,
): number | null {
  if (promptTokens == null && completionTokens == null) return null;
  const rates = RATES[provider];
  const p = (promptTokens ?? 0) / 1000;
  const c = (completionTokens ?? 0) / 1000;
  return Number((p * rates.prompt + c * rates.completion).toFixed(6));
}

export function usageFromCompletionJson(
  provider: GatewayProviderId,
  json: unknown,
): GatewayUsage {
  const usage =
    json && typeof json === "object" && "usage" in json
      ? (json as { usage?: { prompt_tokens?: number; completion_tokens?: number } }).usage
      : undefined;
  const promptTokens = usage?.prompt_tokens ?? null;
  const completionTokens = usage?.completion_tokens ?? null;
  return {
    promptTokens,
    completionTokens,
    estimatedCostUsd: estimateGatewayCostUsd(provider, promptTokens, completionTokens),
  };
}

/** Daily $ soft-cap for free tier (env override). Pro bypasses via quota helper. */
export function doctorDailyUsdLimit(): number {
  const raw = process.env.AI_DOCTOR_DAILY_USD_LIMIT?.trim();
  if (!raw) return 1; // $1/day soft default for free (telemetry gate)
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

export function doctorDailyRequestLimit(): number {
  const raw = process.env.AI_DOCTOR_DAILY_REQUEST_LIMIT?.trim();
  if (!raw) return 100;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 100;
}
