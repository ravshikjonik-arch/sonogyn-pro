import {
  resolveLlmProvider,
  resolveProviderChain,
  type GatewayProviderId,
  type LlmPurpose,
} from "@/lib/ai/gateway";

export type ModelAttempt = {
  modelId: string;
  provider: GatewayProviderId | string;
  apiKey?: string;
  url?: string;
  isLocal?: boolean;
};

export {
  isRetryableProviderError,
  shouldFailoverToNextProvider,
  LOCAL_PROVIDER_ATTEMPT_TIMEOUT_MS,
  CLOUD_PROVIDER_ATTEMPT_TIMEOUT_MS,
} from "./provider-failover";

/**
 * Provider × model attempts for chat.
 * Order follows gateway resolve (default cloud-first); optional requested model first.
 */
export function buildGatewayAttemptChain(
  purpose: LlmPurpose,
  requested?: string,
): ModelAttempt[] {
  const chain = resolveProviderChain(purpose);
  const attempts: ModelAttempt[] = [];
  const seen = new Set<string>();

  const push = (a: ModelAttempt) => {
    const key = `${a.provider}:${a.modelId}`;
    if (seen.has(key)) return;
    seen.add(key);
    attempts.push(a);
  };

  if (requested?.trim() && chain[0]) {
    push({
      modelId: requested.trim(),
      provider: chain[0].provider,
      apiKey: chain[0].apiKey,
      url: chain[0].url,
      isLocal: chain[0].isLocal,
    });
  }

  for (const llm of chain) {
    push({
      modelId: llm.model,
      provider: llm.provider,
      apiKey: llm.apiKey,
      url: llm.url,
      isLocal: llm.isLocal,
    });
  }

  const fallback = process.env.AI_CHAT_FALLBACK_MODEL?.trim();
  const openRouter = chain.find((c) => c.provider === "openrouter");
  if (fallback && openRouter) {
    push({
      modelId: fallback,
      provider: "openrouter",
      apiKey: openRouter.apiKey,
      url: openRouter.url,
    });
  }

  return attempts;
}

/** @deprecated Prefer buildGatewayAttemptChain — kept for callers that only need model ids. */
export function buildModelFallbackChain(hasImages: boolean, requested?: string): ModelAttempt[] {
  const purpose: LlmPurpose = hasImages ? "vision" : "text";
  const attempts = buildGatewayAttemptChain(purpose, requested);
  if (attempts.length > 0) return attempts;

  // Legacy empty-chain last resort labels (no credentials)
  const llm = resolveLlmProvider(purpose);
  const visionDefault =
    process.env.OPENROUTER_US_VISION_MODEL?.trim() ||
    process.env.OPENROUTER_ORADS_MODEL?.trim() ||
    "openai/gpt-4o-mini";
  const textDefault = process.env.OPENROUTER_ORADS_MODEL?.trim() || "openai/gpt-4o-mini";
  const lastResort = hasImages ? visionDefault : textDefault;
  return [
    {
      modelId: requested?.trim() || llm?.model || lastResort,
      provider: llm?.provider ?? "openrouter",
      apiKey: llm?.apiKey,
      url: llm?.url,
      isLocal: llm?.isLocal,
    },
  ];
}
