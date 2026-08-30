import { resolveLlmProvider } from "@/lib/ai/llm-provider";

export type ModelAttempt = {
  modelId: string;
  provider: string;
};

export function buildModelFallbackChain(hasImages: boolean, requested?: string): ModelAttempt[] {
  const attempts: ModelAttempt[] = [];
  const llm = resolveLlmProvider(hasImages ? "vision" : "text");

  if (requested?.trim()) {
    attempts.push({ modelId: requested.trim(), provider: llm?.provider ?? "openrouter" });
  }

  if (llm) {
    attempts.push({ modelId: llm.model, provider: llm.provider });
  }

  const fallback = process.env.AI_CHAT_FALLBACK_MODEL?.trim();
  if (fallback && !attempts.some((a) => a.modelId === fallback)) {
    attempts.push({ modelId: fallback, provider: "openrouter" });
  }

  const visionDefault =
    process.env.OPENROUTER_US_VISION_MODEL?.trim() ||
    process.env.OPENROUTER_ORADS_MODEL?.trim() ||
    "openai/gpt-4o-mini";

  const textDefault =
    process.env.OPENROUTER_ORADS_MODEL?.trim() || "openai/gpt-4o-mini";

  const lastResort = hasImages ? visionDefault : textDefault;
  if (!attempts.some((a) => a.modelId === lastResort)) {
    attempts.push({ modelId: lastResort, provider: "openrouter" });
  }

  return attempts;
}

export function isRetryableProviderError(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}
