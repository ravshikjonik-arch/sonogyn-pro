import type { OradsExtractedInput } from "@repo/orads-us";

import { defaultFeatureRegistry } from "../features";
import type { FeatureRegistry } from "../registry";
import { assembleExtraction, VIOLATION_REASONS } from "./assemble";
import { crossCheckWithOradsRuleParse } from "./cross-check";
import { buildExtractionMessages, MORPHOLOGY_EXTRACTION_PROMPT_VERSION, type ExtractionMessage } from "./prompt";
import { parseModelPayload } from "./schema";
import { fingerprint } from "./text";
import type { BlockReason, MorphologyExtractionResult } from "./types";

export const DEFAULT_MAX_EXTRACTION_CHARS = 8000;

/** Provider-agnostic completion. Web binds it to the existing AI Gateway. */
export type ExtractionCompletion = (request: {
  messages: ExtractionMessage[];
  jsonObject: true;
  temperature: number;
}) => Promise<
  | { ok: true; content: string; model: string | null; provider: string | null }
  | { ok: false; error: string }
>;

/** Existing platform guards, injected (they live in apps/web). Required on purpose. */
export type ExtractionGuards = {
  detectPhi: (text: string) => { ok: boolean; reasons: string[] };
  detectPromptInjection: (text: string) => { ok: true } | { ok: false; reasons: string[] };
};

export type RunExtractionInput = {
  text: string;
  complete: ExtractionCompletion;
  guards: ExtractionGuards;
  /** Optional rule-based second opinion (e.g. `parseOradsProtocolText`). */
  ruleCrossCheck?: (text: string) => OradsExtractedInput;
  registry?: FeatureRegistry;
  now?: () => string;
  extractionId?: string;
  maxChars?: number;
};

function emptyResult(
  base: Pick<MorphologyExtractionResult, "extractionId" | "extractionTimestamp" | "sourceTextReference">,
  status: MorphologyExtractionResult["validationStatus"],
  issues: string[],
  extra: Partial<MorphologyExtractionResult> = {},
): MorphologyExtractionResult {
  return {
    ...base,
    observations: [],
    evidence: [],
    subjects: [],
    unresolvedMentions: [],
    ambiguities: [],
    missingInformation: [],
    extractionModel: { provider: null, model: null },
    promptVersion: MORPHOLOGY_EXTRACTION_PROMPT_VERSION,
    validationStatus: status,
    issues,
    ...extra,
  };
}

/**
 * Medical text → guards → AI extraction → strict validation → canonical observations.
 * Never calls a classification engine. Output observations are `suggested` / `uncertain` /
 * `contradicted` and require physician review.
 */
export async function runMorphologyExtraction(input: RunExtractionInput): Promise<MorphologyExtractionResult> {
  const registry = input.registry ?? defaultFeatureRegistry;
  const text = (input.text ?? "").normalize("NFC");
  const timestamp = (input.now ?? (() => new Date().toISOString()))();
  const extractionId = input.extractionId ?? `mx-${fingerprint(text)}-${Date.parse(timestamp).toString(36)}`;
  const base = {
    extractionId,
    extractionTimestamp: timestamp,
    sourceTextReference: { charLength: text.length, fingerprint: fingerprint(text) },
  };
  const blocked = (reason: BlockReason, issue: string) =>
    emptyResult(base, "blocked", [issue], { blockReason: reason });

  if (!text.trim()) return blocked("empty_text", "empty input text");
  if (text.length > (input.maxChars ?? DEFAULT_MAX_EXTRACTION_CHARS)) {
    return blocked("text_too_long", `input exceeds ${input.maxChars ?? DEFAULT_MAX_EXTRACTION_CHARS} characters`);
  }

  const phi = input.guards.detectPhi(text);
  if (!phi.ok) return blocked("phi_detected", `PHI detected: ${phi.reasons.join(", ")}`);
  const injection = input.guards.detectPromptInjection(text);
  if (!injection.ok) return blocked("prompt_injection", "prompt injection pattern detected");

  const completion = await input.complete({
    messages: buildExtractionMessages(text, { registry }),
    jsonObject: true,
    temperature: 0,
  });
  if (!completion.ok) {
    return emptyResult(base, "provider_error", [`provider error: ${completion.error}`]);
  }
  const extractionModel = { provider: completion.provider, model: completion.model };

  const parsed = parseModelPayload(completion.content);
  if (!parsed.ok) {
    return emptyResult(base, "invalid", parsed.issues, { extractionModel });
  }

  const assembled = assembleExtraction(parsed.payload, parsed.rejected, { text, extractionId, timestamp, registry });

  const ambiguities = [...assembled.ambiguities];
  const issues = [...parsed.issues];
  if (input.ruleCrossCheck) {
    try {
      ambiguities.push(
        ...crossCheckWithOradsRuleParse(assembled.observations, assembled.subjects, input.ruleCrossCheck(text)),
      );
    } catch {
      issues.push("rule cross-check failed (ignored)");
    }
  }

  const violations = assembled.unresolvedMentions.filter((u) => VIOLATION_REASONS.has(u.reason));
  if (violations.length) issues.push(`${violations.length} mention(s) rejected by validation`);

  return {
    ...base,
    ...assembled,
    ambiguities,
    extractionModel,
    promptVersion: MORPHOLOGY_EXTRACTION_PROMPT_VERSION,
    validationStatus: violations.length || parsed.issues.length ? "valid_with_issues" : "valid",
    issues,
  };
}
