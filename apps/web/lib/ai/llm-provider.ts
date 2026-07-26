/**
 * Выбор LLM-провайдера: Perplexity (текст / Evidence) или OpenRouter (в т.ч. vision).
 *
 * Env:
 *   PERPLEXITY_API_KEY          — ключ с perplexity.ai
 *   PERPLEXITY_API_URL          — default https://api.perplexity.ai/chat/completions
 *   PERPLEXITY_MODEL            — default sonar-pro
 *   LLM_PROVIDER=perplexity|openrouter|auto  (default auto)
 *   OPENROUTER_*                — как раньше
 */

export type LlmPurpose = "text" | "vision" | "evidence";

export type ResolvedLlm = {
  provider: "perplexity" | "openrouter";
  apiKey: string;
  url: string;
  model: string;
};

const OPENROUTER_DEFAULT_URL = "https://openrouter.ai/api/v1/chat/completions";
/** OpenAI-compatible endpoint (официальный SDK / chat completions). */
const PERPLEXITY_DEFAULT_URL = "https://api.perplexity.ai/chat/completions";

export function resolveLlmProvider(purpose: LlmPurpose = "text"): ResolvedLlm | null {
  const forced = (process.env.LLM_PROVIDER?.trim().toLowerCase() || "auto") as
    | "perplexity"
    | "openrouter"
    | "auto";
  const perplexityKey = process.env.PERPLEXITY_API_KEY?.trim();
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();

  if (purpose === "vision") {
    if (!openRouterKey) return null;
    return {
      provider: "openrouter",
      apiKey: openRouterKey,
      url: process.env.OPENROUTER_API_URL?.trim() || OPENROUTER_DEFAULT_URL,
      model:
        process.env.OPENROUTER_US_VISION_MODEL?.trim() ||
        process.env.OPENROUTER_ORADS_MODEL?.trim() ||
        "openai/gpt-4o-mini",
    };
  }

  const wantPerplexity =
    forced === "perplexity" || (forced === "auto" && Boolean(perplexityKey));

  if (wantPerplexity && perplexityKey) {
    const evidenceModel = process.env.PERPLEXITY_EVIDENCE_MODEL?.trim();
    return {
      provider: "perplexity",
      apiKey: perplexityKey,
      url: process.env.PERPLEXITY_API_URL?.trim() || PERPLEXITY_DEFAULT_URL,
      model:
        (purpose === "evidence" ? evidenceModel : undefined) ||
        process.env.PERPLEXITY_MODEL?.trim() ||
        "sonar-pro",
    };
  }

  if (openRouterKey && forced !== "perplexity") {
    const evidenceModel = process.env.OPENROUTER_EVIDENCE_MODEL?.trim();
    return {
      provider: "openrouter",
      apiKey: openRouterKey,
      url: process.env.OPENROUTER_API_URL?.trim() || OPENROUTER_DEFAULT_URL,
      model:
        (purpose === "evidence" ? evidenceModel : undefined) ||
        process.env.OPENROUTER_ORADS_MODEL?.trim() ||
        "openai/gpt-4o-mini",
    };
  }

  if (perplexityKey) {
    return {
      provider: "perplexity",
      apiKey: perplexityKey,
      url: process.env.PERPLEXITY_API_URL?.trim() || PERPLEXITY_DEFAULT_URL,
      model: process.env.PERPLEXITY_MODEL?.trim() || "sonar-pro",
    };
  }

  return null;
}

/** Perplexity часто не принимает response_format — JSON просим в system prompt. */
export function llmSupportsJsonObjectMode(provider: ResolvedLlm["provider"]): boolean {
  return provider === "openrouter";
}

export function hasAnyLlmConfigured(): boolean {
  return Boolean(
    process.env.PERPLEXITY_API_KEY?.trim() || process.env.OPENROUTER_API_KEY?.trim(),
  );
}
