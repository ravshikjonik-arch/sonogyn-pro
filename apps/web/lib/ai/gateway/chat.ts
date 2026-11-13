import { callOpenRouterChat, extractOpenRouterChatContent } from "@/lib/ai/sonogyn-chat/openrouter-client";
import {
  CLOUD_PROVIDER_ATTEMPT_TIMEOUT_MS,
  LOCAL_PROVIDER_ATTEMPT_TIMEOUT_MS,
} from "@/lib/ai/sonogyn-chat/provider-failover";

import { usageFromCompletionJson } from "./cost";
import { resolveProviderChain } from "./resolve";
import type {
  GatewayChatMessage,
  GatewayChatResult,
  GatewayProviderId,
  LlmPurpose,
  ResolvedLlm,
} from "./types";

export type GatewayChatParams = {
  purpose?: LlmPurpose;
  messages: GatewayChatMessage[];
  temperature?: number;
  /** Force response_format json_object when provider supports it. */
  jsonObject?: boolean;
  timeoutMs?: number;
  maxAttemptsPerProvider?: number;
  /** Override chain (tests). */
  chain?: ResolvedLlm[];
  appUrl?: string;
};

function extractContent(json: unknown): string {
  if (json && typeof json === "object") {
    return extractOpenRouterChatContent(
      json as { choices?: Array<{ message?: { content?: string | null } }> },
    );
  }
  return "";
}

async function callOne(
  llm: ResolvedLlm,
  params: GatewayChatParams,
): Promise<{ ok: true; content: string; raw: unknown } | { ok: false; error: string }> {
  const body: Record<string, unknown> = {
    model: llm.model,
    temperature: params.temperature ?? 0.2,
    messages: params.messages,
  };
  if (params.jsonObject && (llm.provider === "openrouter" || llm.provider === "colibri")) {
    body.response_format = { type: "json_object" };
  }

  const result = await callOpenRouterChat({
    apiKey: llm.apiKey,
    url: llm.url,
    appUrl: params.appUrl,
    body,
    timeoutMs:
      params.timeoutMs ??
      (llm.isLocal ? LOCAL_PROVIDER_ATTEMPT_TIMEOUT_MS : CLOUD_PROVIDER_ATTEMPT_TIMEOUT_MS),
    maxAttempts: params.maxAttemptsPerProvider ?? (llm.isLocal ? 1 : 2),
  });

  if (!result.ok) {
    return { ok: false, error: `${llm.provider}:${result.status}:${result.code}` };
  }

  let json: unknown;
  try {
    json = await result.response.json();
  } catch {
    return { ok: false, error: `${llm.provider}:invalid_json` };
  }

  const content = extractContent(json);
  if (!content) return { ok: false, error: `${llm.provider}:empty_content` };
  return { ok: true, content, raw: json };
}

/**
 * Unified chat/completions with provider failover.
 * Does not change UI contracts — callers get content + metering metadata.
 */
export async function gatewayChatCompletion(params: GatewayChatParams): Promise<GatewayChatResult> {
  const purpose = params.purpose ?? "text";
  const chain = params.chain ?? resolveProviderChain(purpose);
  const tried: GatewayProviderId[] = [];

  if (chain.length === 0) {
    return { ok: false, error: "no_llm_configured", attempts: 0, tried };
  }

  let attempts = 0;
  for (let i = 0; i < chain.length; i++) {
    const llm = chain[i]!;
    tried.push(llm.provider);
    attempts += 1;
    const res = await callOne(llm, params);
    if (res.ok) {
      return {
        ok: true,
        provider: llm.provider,
        model: llm.model,
        content: res.content,
        raw: res.raw,
        usage: usageFromCompletionJson(llm.provider, res.raw),
        attempts,
        usedFallback: i > 0,
      };
    }
  }

  return {
    ok: false,
    error: `all_providers_failed:${tried.join(",")}`,
    attempts,
    tried,
  };
}
