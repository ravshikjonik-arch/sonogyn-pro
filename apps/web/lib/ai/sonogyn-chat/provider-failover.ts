/**
 * P0 provider failover policy for AI Chat / Gateway.
 * Pure helpers — unit-tested without live LLM calls.
 */

import type { SonogynAiErrorCode } from "./errors";

/** A — try next provider; B — bad request; C — provider auth/config; D — security (pre-provider). */
export type ProviderFailureCategory =
  | "retryable"
  | "invalid_request"
  | "auth_config"
  | "security";

export const LOCAL_PROVIDER_ATTEMPT_TIMEOUT_MS = 15_000;
export const CLOUD_PROVIDER_ATTEMPT_TIMEOUT_MS = 90_000;

const NETWORK_ERROR_RE =
  /ECONNREFUSED|ETIMEDOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN|getaddrinfo|fetch failed|network|socket|UND_ERR|other side closed/i;

export function isNetworkFailureMessage(text: string | undefined | null): boolean {
  if (!text) return false;
  return NETWORK_ERROR_RE.test(text);
}

export function classifyProviderFailure(input: {
  status: number;
  code?: SonogynAiErrorCode | string | null;
  bodyText?: string | null;
}): ProviderFailureCategory {
  const code = (input.code || "").toLowerCase();
  const body = input.bodyText || "";

  // App-level security (PHI / injection) — never hop providers.
  if (code === "phi_detected" || code === "prompt_injection") {
    return "security";
  }

  if (code === "invalid_request" || input.status === 400 || input.status === 422) {
    return "invalid_request";
  }

  // Provider credential/config (Colibri/OpenRouter key) — may try next vendor once.
  // User session "auth" is handled before the provider loop in /api/ai/chat.
  if (input.status === 401 || input.status === 403 || code === "config") {
    return "auth_config";
  }

  if (
    input.status === 429 ||
    input.status === 500 ||
    input.status === 502 ||
    input.status === 503 ||
    input.status === 504 ||
    input.status === 529 ||
    code === "timeout" ||
    code === "rate_limit" ||
    code === "overloaded" ||
    code === "provider" ||
    code === "unknown" ||
    isNetworkFailureMessage(body)
  ) {
    return "retryable";
  }

  // Default: treat as retryable transport/provider issue when hopping is still possible.
  if (input.status >= 500) return "retryable";
  return "invalid_request";
}

/**
 * Whether chat may attempt the next provider in the chain.
 * - No failover after stream bytes committed to the client.
 * - No failover for security / invalid client request.
 * - Auth_config (provider key) and retryable → failover if another provider remains.
 */
export function shouldFailoverToNextProvider(input: {
  status: number;
  code?: SonogynAiErrorCode | string | null;
  bodyText?: string | null;
  hasNextProvider: boolean;
  /** True once any response body/SSE has been sent to the client. */
  streamCommitted?: boolean;
}): boolean {
  if (input.streamCommitted) return false;
  if (!input.hasNextProvider) return false;

  const category = classifyProviderFailure(input);
  if (category === "security" || category === "invalid_request") return false;
  return category === "retryable" || category === "auth_config";
}

/** @deprecated Prefer shouldFailoverToNextProvider — kept for call sites that only have status. */
export function isRetryableProviderError(status: number, bodyText?: string): boolean {
  return shouldFailoverToNextProvider({
    status,
    bodyText,
    code: status === 504 ? "timeout" : undefined,
    hasNextProvider: true,
    streamCommitted: false,
  });
}

/**
 * Simulate sequential provider attempts (unit-test helper; mirrors chat classic loop).
 * Failover only before a successful result; never after streamCommitted becomes true.
 */
export async function runSequentialProviderAttempts<T>(params: {
  providers: string[];
  call: (provider: string) => Promise<
    | { ok: true; value: T }
    | { ok: false; status: number; code?: string; bodyText?: string }
  >;
  /** Called when about to return success — mark stream committed in real HTTP. */
  onSuccessBeforeReturn?: (provider: string, value: T) => void | Promise<void>;
}): Promise<
  | { ok: true; provider: string; value: T; attempts: number; usedFallback: boolean }
  | { ok: false; error: string; tried: string[]; attempts: number }
> {
  const tried: string[] = [];
  let streamCommitted = false;

  for (let i = 0; i < params.providers.length; i++) {
    const provider = params.providers[i]!;
    tried.push(provider);
    const result = await params.call(provider);

    if (result.ok) {
      await params.onSuccessBeforeReturn?.(provider, result.value);
      streamCommitted = true;
      return {
        ok: true,
        provider,
        value: result.value,
        attempts: tried.length,
        usedFallback: i > 0,
      };
    }

    const canFailover = shouldFailoverToNextProvider({
      status: result.status,
      code: result.code,
      bodyText: result.bodyText,
      hasNextProvider: i < params.providers.length - 1,
      streamCommitted,
    });

    if (canFailover) continue;

    return {
      ok: false,
      error: `${provider}:${result.status}:${result.code ?? "error"}`,
      tried,
      attempts: tried.length,
    };
  }

  return {
    ok: false,
    error: `all_providers_failed:${tried.join(",")}`,
    tried,
    attempts: tried.length,
  };
}
