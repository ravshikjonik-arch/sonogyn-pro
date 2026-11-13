import {
  createIdempotencyCache,
  runMedicalIntelligence,
  type MedicalIntelligenceRequest,
  type MedicalIntelligenceResult,
  type MiDependencies,
} from "@repo/medical-intelligence";

import { runMiEvidence, type MiEvidenceDeps } from "@/lib/ai/mi/evidence-binding";
import { extractMorphologyFromText, type ExtractMorphologyDeps } from "@/lib/ai/morphology-extraction/extract-morphology";
import { detectPromptInjection } from "@/lib/ai/sonogyn-chat/security/prompt-injection";
import { detectPhi } from "@/lib/security/phi-detection";

export type MiWebDeps = {
  extraction?: ExtractMorphologyDeps;
  evidence?: MiEvidenceDeps;
  now?: () => string;
  newRequestId?: () => string;
};

/** Binds the shared orchestrator to the existing web components. Nothing is re-implemented. */
export function buildMiDependencies(userId: string, deps: MiWebDeps = {}): MiDependencies {
  return {
    guards: { detectPhi, detectPromptInjection },
    extractText: ({ text, requestId }) => extractMorphologyFromText({ text, userId, extractionId: requestId }, deps.extraction),
    retrieveEvidence: ({ query, corpusMode }) => runMiEvidence({ query, corpusMode, userId }, deps.evidence),
    now: deps.now,
    newRequestId: deps.newRequestId,
  };
}

const IDEMPOTENCY_TTL_MS = 60_000;
const cache = createIdempotencyCache<MedicalIntelligenceResult>({ ttlMs: IDEMPOTENCY_TTL_MS, maxEntries: 500 });

/**
 * Per-user idempotency: the same `idempotencyKey` within 60 s returns the first result
 * (in-flight calls are coalesced) — no second provider call. In-memory, per instance.
 */
export async function runMedicalIntelligenceForUser(
  request: MedicalIntelligenceRequest,
  userId: string,
  deps: MiWebDeps = {},
): Promise<MedicalIntelligenceResult> {
  const run = () => runMedicalIntelligence(request, buildMiDependencies(userId, deps));
  if (!request.idempotencyKey) return run();
  const { value, replay } = await cache.run(`${userId}:${request.idempotencyKey}`, run);
  return replay ? { ...value, processingMetadata: { ...value.processingMetadata, idempotentReplay: true } } : value;
}
