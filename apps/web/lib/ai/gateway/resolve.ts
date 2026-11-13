import type { GatewayProviderId, LlmPurpose, ResolvedLlm } from "./types";

const OPENROUTER_DEFAULT_URL = "https://openrouter.ai/api/v1/chat/completions";
const PERPLEXITY_DEFAULT_URL = "https://api.perplexity.ai/chat/completions";
const COLIBRI_DEFAULT_BASE = "http://127.0.0.1:8000/v1";

function openRouterChatUrl(): string {
  return process.env.OPENROUTER_API_URL?.trim() || OPENROUTER_DEFAULT_URL;
}

function perplexityChatUrl(): string {
  return process.env.PERPLEXITY_API_URL?.trim() || PERPLEXITY_DEFAULT_URL;
}

/** Normalize base (`…/v1`) → chat completions URL. */
export function colibriChatUrl(baseOverride?: string): string {
  const base = (baseOverride || process.env.COLIBRI_BASE_URL?.trim() || COLIBRI_DEFAULT_BASE).replace(
    /\/$/,
    "",
  );
  if (base.endsWith("/chat/completions")) return base;
  return `${base}/chat/completions`;
}

/**
 * Colibri is optional and **off by default**.
 * Enable only with COLIBRI_ENABLED=true|1|on, or LLM_PROVIDER=colibri.
 * Setting COLIBRI_MODEL alone must NOT put Colibri in the chain (prod-safe).
 */
export function isColibriEnabled(): boolean {
  const forced = (process.env.LLM_PROVIDER?.trim().toLowerCase() || "auto") as string;
  if (forced === "colibri") return true;
  const flag = process.env.COLIBRI_ENABLED?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "on";
}

function resolveColibri(purpose: LlmPurpose): ResolvedLlm | null {
  if (!isColibriEnabled()) return null;

  const forced = (process.env.LLM_PROVIDER?.trim().toLowerCase() || "auto") as string;
  const model =
    (purpose === "evidence" ? process.env.COLIBRI_EVIDENCE_MODEL?.trim() : undefined) ||
    (purpose === "vision" ? process.env.COLIBRI_VISION_MODEL?.trim() : undefined) ||
    process.env.COLIBRI_MODEL?.trim();

  // Vision needs explicit model — Colibri language engines may not multimodal.
  if (purpose === "vision" && !process.env.COLIBRI_VISION_MODEL?.trim()) return null;

  if (!model) {
    // Forced provider without model id — still allow (server may list /models).
    if (forced === "colibri") {
      return {
        provider: "colibri",
        apiKey: process.env.COLIBRI_API_KEY?.trim() || "colibri-local",
        url: colibriChatUrl(),
        model: "default",
        isLocal: true,
      };
    }
    return null;
  }

  return {
    provider: "colibri",
    apiKey: process.env.COLIBRI_API_KEY?.trim() || "colibri-local",
    url: colibriChatUrl(),
    model,
    isLocal: true,
  };
}

function resolvePerplexity(purpose: LlmPurpose): ResolvedLlm | null {
  const key = process.env.PERPLEXITY_API_KEY?.trim();
  if (!key) return null;
  if (purpose === "vision") return null;
  const evidenceModel = process.env.PERPLEXITY_EVIDENCE_MODEL?.trim();
  return {
    provider: "perplexity",
    apiKey: key,
    url: perplexityChatUrl(),
    model:
      (purpose === "evidence" ? evidenceModel : undefined) ||
      process.env.PERPLEXITY_MODEL?.trim() ||
      "sonar-pro",
  };
}

function resolveOpenRouter(purpose: LlmPurpose): ResolvedLlm | null {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) return null;
  const evidenceModel = process.env.OPENROUTER_EVIDENCE_MODEL?.trim();
  return {
    provider: "openrouter",
    apiKey: key,
    url: openRouterChatUrl(),
    model:
      purpose === "vision"
        ? process.env.OPENROUTER_US_VISION_MODEL?.trim() ||
          process.env.OPENROUTER_ORADS_MODEL?.trim() ||
          "openai/gpt-4o-mini"
        : (purpose === "evidence" ? evidenceModel : undefined) ||
          process.env.OPENROUTER_ORADS_MODEL?.trim() ||
          "openai/gpt-4o-mini",
  };
}

/**
 * Ordered candidate list for a purpose.
 * Env:
 *   LLM_PROVIDER=auto|colibri|perplexity|openrouter
 *   LLM_FALLBACK_ORDER=colibri,openrouter,perplexity  (optional override for auto)
 *   COLIBRI_ENABLED=true required for Colibri slot (unless LLM_PROVIDER=colibri)
 */
export function resolveProviderChain(purpose: LlmPurpose = "text"): ResolvedLlm[] {
  const forced = (process.env.LLM_PROVIDER?.trim().toLowerCase() || "auto") as
    | "auto"
    | GatewayProviderId
    | string;

  const byId: Record<GatewayProviderId, () => ResolvedLlm | null> = {
    colibri: () => resolveColibri(purpose),
    perplexity: () => resolvePerplexity(purpose),
    openrouter: () => resolveOpenRouter(purpose),
  };

  if (forced === "colibri" || forced === "perplexity" || forced === "openrouter") {
    const primary = byId[forced]();
    const chain: ResolvedLlm[] = [];
    if (primary) chain.push(primary);
    // Always allow cloud fallback unless LLM_STRICT_PROVIDER=1
    const strict = process.env.LLM_STRICT_PROVIDER?.trim() === "1";
    if (!strict) {
      for (const id of ["colibri", "openrouter", "perplexity"] as GatewayProviderId[]) {
        if (id === forced) continue;
        const next = byId[id]();
        if (next) chain.push(next);
      }
    }
    return dedupeChain(chain);
  }

  // auto (+ optional LLM_FALLBACK_ORDER)
  const orderRaw = process.env.LLM_FALLBACK_ORDER?.trim();
  // Cloud-first: production/serverless must not depend on localhost Colibri.
  const defaultOrder: GatewayProviderId[] =
    purpose === "vision"
      ? ["openrouter", "colibri"]
      : ["openrouter", "perplexity", "colibri"];

  const order: GatewayProviderId[] = orderRaw
    ? (orderRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s): s is GatewayProviderId =>
          s === "colibri" || s === "perplexity" || s === "openrouter",
        ) as GatewayProviderId[])
    : defaultOrder;

  const chain: ResolvedLlm[] = [];
  for (const id of order) {
    const resolved = byId[id]();
    if (resolved) chain.push(resolved);
  }
  return dedupeChain(chain);
}

function dedupeChain(chain: ResolvedLlm[]): ResolvedLlm[] {
  const seen = new Set<string>();
  return chain.filter((c) => {
    const key = `${c.provider}:${c.url}:${c.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Primary provider only (backward compatible with resolveLlmProvider). */
export function resolveLlmProvider(purpose: LlmPurpose = "text"): ResolvedLlm | null {
  return resolveProviderChain(purpose)[0] ?? null;
}

export function llmSupportsJsonObjectMode(provider: GatewayProviderId): boolean {
  // Perplexity often rejects response_format; Colibri/OpenRouter are OpenAI-like.
  return provider === "openrouter" || provider === "colibri";
}

export function hasAnyLlmConfigured(): boolean {
  return Boolean(
    process.env.PERPLEXITY_API_KEY?.trim() ||
      process.env.OPENROUTER_API_KEY?.trim() ||
      isColibriEnabled(),
  );
}

export function listConfiguredProviderIds(): GatewayProviderId[] {
  const ids: GatewayProviderId[] = [];
  if (isColibriEnabled()) {
    ids.push("colibri");
  }
  if (process.env.PERPLEXITY_API_KEY?.trim()) ids.push("perplexity");
  if (process.env.OPENROUTER_API_KEY?.trim()) ids.push("openrouter");
  return ids;
}
