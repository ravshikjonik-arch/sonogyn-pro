import {
  runMorphologyExtraction,
  type ExtractionCompletion,
  type MorphologyExtractionResult,
} from "@repo/morphology-core/extraction";
// Server-safe subpath: the package root re-exports React navigator hooks (not allowed in route handlers).
import { parseOradsProtocolText } from "@repo/orads-us/parse-protocol-text";

import { assertAiGatewayQuota, gatewayChatCompletion } from "@/lib/ai/gateway";
import { detectPromptInjection } from "@/lib/ai/sonogyn-chat/security/prompt-injection";
import { detectPhi } from "@/lib/security/phi-detection";

export type ExtractMorphologyDeps = {
  complete?: ExtractionCompletion;
  checkQuota?: (userId: string) => Promise<{ ok: boolean }>;
  now?: () => string;
};

/** Binds the provider-agnostic pipeline to the existing AI Gateway (failover, timeouts, providers). */
export const gatewayExtractionCompletion: ExtractionCompletion = async ({ messages, jsonObject, temperature }) => {
  const res = await gatewayChatCompletion({ purpose: "text", messages, jsonObject, temperature });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, content: res.content, model: res.model, provider: res.provider };
};

/**
 * Server-side morphology extraction from free clinical text.
 * - Reuses existing PHI / prompt-injection guards and the doctor quota.
 * - Does not persist anything and does not call classification engines.
 * - Returned observations are `suggested` / `uncertain` / `contradicted` for physician review.
 */
export async function extractMorphologyFromText(
  input: { text: string; userId: string; /** Correlation id (e.g. MI requestId). */ extractionId?: string },
  deps: ExtractMorphologyDeps = {},
): Promise<MorphologyExtractionResult> {
  const checkQuota = deps.checkQuota ?? assertAiGatewayQuota;
  const complete = deps.complete ?? gatewayExtractionCompletion;

  let quotaOk = true;
  const guardedComplete: ExtractionCompletion = async (request) => {
    // Quota only matters once local guards passed and a provider call is about to happen.
    const quota = await checkQuota(input.userId);
    if (!quota.ok) {
      quotaOk = false;
      return { ok: false, error: "quota_exceeded" };
    }
    return complete(request);
  };

  const result = await runMorphologyExtraction({
    text: input.text,
    complete: guardedComplete,
    guards: { detectPhi, detectPromptInjection },
    ruleCrossCheck: parseOradsProtocolText,
    now: deps.now,
    extractionId: input.extractionId,
  });

  if (!quotaOk) {
    return { ...result, validationStatus: "blocked", blockReason: "quota_exceeded", issues: ["AI quota exceeded"] };
  }
  return result;
}
