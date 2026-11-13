import {
  searchEvidenceUnified,
  synthesizeEvidenceAnswer,
  type AssistantAnswer,
  type EvidenceCorpusMode,
  type UnifiedSearchResult,
} from "@repo/evidence-retrieval";
import type { EvidenceRunResult } from "@repo/medical-intelligence";

import { assertAiGatewayQuota } from "@/lib/ai/gateway";
import {
  formatEvidenceSourcedChatReply,
  postValidateEvidenceAnswer,
} from "@/lib/ai/sonogyn-chat/evidence-answer-validate";
import { createEvidenceCacheStore } from "@/lib/evidence/redis-cache-store";
import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";
import { synthesizeWithLlm } from "@/lib/evidence/synthesize-llm";

export type MiEvidenceDeps = {
  checkQuota?: (userId: string) => Promise<{ ok: boolean }>;
  search?: (query: string, corpusMode: EvidenceCorpusMode) => Promise<UnifiedSearchResult>;
  synthesize?: (query: string, search: UnifiedSearchResult, corpusMode: EvidenceCorpusMode) => Promise<AssistantAnswer>;
};

const defaultSearch: NonNullable<MiEvidenceDeps["search"]> = async (query, corpusMode) =>
  searchEvidenceUnified(
    { query, limit: 25, preferHighEvidence: true, maxAgeYears: 10, corpusMode },
    { config: await buildRetrievalConfigAsync(), cache: createEvidenceCacheStore() },
  );

const defaultSynthesize: NonNullable<MiEvidenceDeps["synthesize"]> = (query, search, corpusMode) =>
  synthesizeWithLlm(query, search, { translateToRussian: true, corpusMode });

/**
 * Same chain as the Evidence Assistant route and the chat evidence agent — not a second RAG:
 * quota → searchEvidenceUnified → synthesizeWithLlm (rules when nothing found)
 * → formatEvidenceSourcedChatReply → postValidateEvidenceAnswer.
 */
export async function runMiEvidence(
  input: { query: string; corpusMode?: string; userId: string },
  deps: MiEvidenceDeps = {},
): Promise<EvidenceRunResult> {
  const quota = await (deps.checkQuota ?? assertAiGatewayQuota)(input.userId);
  if (!quota.ok) return { ok: false, error: "quota_exceeded", blocked: true };

  const corpusMode = (input.corpusMode ?? "all") as EvidenceCorpusMode;
  try {
    const search = await (deps.search ?? defaultSearch)(input.query, corpusMode);
    const answer =
      search.records.length > 0
        ? await (deps.synthesize ?? defaultSynthesize)(input.query, search, corpusMode)
        : synthesizeEvidenceAnswer(input.query, search, { corpusMode });
    const validation = postValidateEvidenceAnswer(formatEvidenceSourcedChatReply(answer), answer);
    return { ok: true, answer, validation };
  } catch {
    return { ok: false, error: "evidence_retrieval_failed" };
  }
}
