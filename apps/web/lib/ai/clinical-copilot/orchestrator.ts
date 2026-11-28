import {
  searchEvidenceUnified,
  synthesizeEvidenceAnswer,
  type AssistantAnswer,
  type EvidenceCorpusMode,
  type EvidenceRecord,
} from "@repo/evidence-retrieval";
import type { BrainSession, CalcContract } from "@repo/medical-calculations";

/** Ответ локального brain / LlmClinicalBrain перед evidence-обогащением. */
export type CopilotBrainTurn = {
  reply: string;
  intent: CalcContract["intent"] | string;
  contract: CalcContract;
  session: BrainSession;
  pubmedHits?: BrainTurnPubmedHits;
};

type BrainTurnPubmedHits = NonNullable<
  import("@repo/medical-calculations").BrainTurn["pubmedHits"]
>;

import { createEvidenceCacheStore } from "@/lib/evidence/redis-cache-store";
import { buildRetrievalConfigAsync } from "@/lib/evidence/retrieval-config";
import { synthesizeWithLlm } from "@/lib/evidence/synthesize-llm";

import { registryHintsForQuery } from "./registry-hints";

const EVIDENCE_INTENTS = new Set<CalcContract["intent"]>(["lookup_kr", "explain_term", "pubmed_search"]);

const GUIDELINE_RE =
  /(?:рекомендац|гайдлайн|клиническ|мз\s*рф|ктр|тактик|порог|стандарт|consensus|acr|figo|fmf|кр\s*рф)/i;

export type ClinicalCopilotEvidenceMeta = {
  /** full — PubMed/КР-синтез; registry — только ссылки на стандарты платформы (без сети). */
  tier: "full" | "registry";
  evidenceStrength: AssistantAnswer["evidenceStrength"] | "registry_hints";
  synthesisMode: AssistantAnswer["synthesisMode"] | "registry";
  citationCount: number;
  registryHintCount?: number;
  corpusMode: EvidenceCorpusMode;
  insufficient?: boolean;
};

export function inferCorpusMode(query: string): EvidenceCorpusMode {
  const q = query.toLowerCase();
  if (/(?:мз\s*рф|клиническ\w*\s+рекоменд|кр\s*рф|росздрав|grls|россия)/i.test(q)) return "rf_kr";
  if (/(?:pubmed|cochrane|who|nice|ema|europe\s*pmc|стать)/i.test(q)) return "all";
  return "all";
}

function mapEvidenceRecordsToCitations(records: EvidenceRecord[]): CalcContract["citations"] {
  return records.slice(0, 10).map((r) => ({
    organization:
      r.provider === "kr_mz_rf"
        ? "МЗ РФ"
        : r.provider === "pubmed" || r.provider === "europe_pmc"
          ? "PubMed"
          : r.journal || String(r.provider),
    document: r.title,
    year: typeof r.year === "number" ? r.year : new Date().getFullYear(),
    status: r.recordType === "guideline" ? "клиническая рекомендация" : "публикация",
    url: r.url,
  }));
}

export function shouldEnrichWithEvidence(turn: CopilotBrainTurn, query: string, enabled: boolean): boolean {
  if (!enabled) return false;
  if (query.length < 3) return false;
  const intent = turn.intent as CalcContract["intent"];
  if (intent === "image_checklist") return false;
  if (intent === "draft_protocol") return false;
  if (turn.contract.missingSlots && turn.contract.missingSlots.length > 0) return false;
  if (intent === "calculate" && turn.contract.result && Object.keys(turn.contract.result).length > 0) {
    return false;
  }
  if (EVIDENCE_INTENTS.has(intent)) return true;
  if (intent === "calculate" && !turn.contract.result) return true;
  return GUIDELINE_RE.test(query);
}

/** После успешного расчёта — без PubMed, только реестр стандартов (быстро, без тяжёлого retrieval). */
export function shouldAttachRegistryHints(turn: CopilotBrainTurn, query: string, enabled: boolean): boolean {
  if (!enabled) return false;
  if (shouldEnrichWithEvidence(turn, query, enabled)) return false;
  if (registryHintsForQuery(query).length === 0) return false;
  const intent = turn.intent as CalcContract["intent"];
  return Boolean(
    intent === "calculate" &&
      turn.contract.result &&
      Object.keys(turn.contract.result).length > 0,
  );
}

export function enrichBrainTurnWithRegistryHints(
  turn: CopilotBrainTurn,
  query: string,
): { turn: CopilotBrainTurn; evidence: ClinicalCopilotEvidenceMeta } {
  const registryLines = registryHintsForQuery(query);
  const reply =
    registryLines.length > 0
      ? `${turn.reply}\n\nМеждународные стандарты на платформе:\n${registryLines.join("\n")}`
      : turn.reply;
  const mergedContract: CalcContract = {
    ...turn.contract,
    notes: [...(turn.contract.notes ?? []), "evidence:registry_tier"],
  };
  return {
    turn: { ...turn, reply, contract: mergedContract },
    evidence: {
      tier: "registry",
      evidenceStrength: "registry_hints",
      synthesisMode: "registry",
      citationCount: 0,
      registryHintCount: registryLines.length,
      corpusMode: inferCorpusMode(query),
    },
  };
}

async function fetchEvidenceAnswer(
  query: string,
  corpusMode: EvidenceCorpusMode,
  useLlm: boolean,
): Promise<AssistantAnswer> {
  const config = await buildRetrievalConfigAsync();
  const searchResult = await searchEvidenceUnified(
    {
      query,
      limit: 20,
      preferHighEvidence: true,
      maxAgeYears: 12,
      corpusMode,
    },
    { config, cache: createEvidenceCacheStore() },
  );
  if (useLlm && searchResult.records.length > 0) {
    return synthesizeWithLlm(query, searchResult, { translateToRussian: true, corpusMode });
  }
  return synthesizeEvidenceAnswer(query, searchResult, { corpusMode });
}

function appendEvidenceBlock(reply: string, answer: AssistantAnswer, registryLines: string[]): string {
  const parts = [reply];
  if (answer.summary?.trim()) {
    parts.push(
      "\n\n— Evidence (PubMed, Europe PMC, КР, vault) —\n" +
        answer.summary.trim() +
        `\n\nСила доказательств: ${answer.gradeLabel}.`,
    );
  }
  if (registryLines.length > 0) {
    parts.push("\n\nМеждународные стандарты на платформе:\n" + registryLines.join("\n"));
  }
  if (answer.insufficient) {
    parts.push("\n\n⚠ Недостаточно цитируемых источников для автоматического синтеза — опирайтесь на первичные документы.");
  }
  return parts.join("");
}

export async function enrichBrainTurnWithEvidence(
  turn: CopilotBrainTurn,
  query: string,
  opts: { corpusMode?: EvidenceCorpusMode; useLlm?: boolean } = {},
): Promise<{ turn: CopilotBrainTurn; evidence: ClinicalCopilotEvidenceMeta }> {
  const corpusMode = opts.corpusMode ?? inferCorpusMode(query);
  const useLlm = Boolean(opts.useLlm);
  const answer = await fetchEvidenceAnswer(query, corpusMode, useLlm);
  const registryLines = registryHintsForQuery(query);
  const evidenceCitations = mapEvidenceRecordsToCitations(answer.citations);

  const mergedContract: CalcContract = {
    ...turn.contract,
    intent:
      turn.intent === "pubmed_search"
        ? "pubmed_search"
        : (turn.contract.intent ?? ("lookup_kr" as const)),
    citations: [...turn.contract.citations, ...evidenceCitations],
    notes: [
      ...(turn.contract.notes ?? []),
      `evidence:${answer.evidenceStrength}`,
      `corpus:${corpusMode}`,
    ],
  };

  const reply = appendEvidenceBlock(turn.reply, answer, registryLines);

  return {
    turn: {
      ...turn,
      reply,
      contract: mergedContract,
      pubmedHits:
        turn.pubmedHits ??
        answer.citations
          .filter((c) => c.provider === "pubmed" || c.provider === "europe_pmc")
          .slice(0, 5)
          .map((c) => ({
            title: c.title,
            year: c.year ? String(c.year) : undefined,
            journal: c.journal,
            url: c.url,
            source: c.provider === "pubmed" ? "pubmed" : "epmc",
          })),
    },
    evidence: {
      tier: "full",
      evidenceStrength: answer.evidenceStrength,
      synthesisMode: answer.synthesisMode,
      citationCount: answer.citations.length,
      corpusMode,
      insufficient: answer.insufficient,
    },
  };
}