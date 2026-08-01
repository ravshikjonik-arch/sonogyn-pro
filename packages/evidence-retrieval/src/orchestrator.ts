import { cochraneAdapter, europePmcAdapter } from "./adapters/europe-pmc.adapter.js";
import { pubmedAdapter } from "./adapters/pubmed.adapter.js";
import { semanticScholarAdapter } from "./adapters/semantic-scholar.adapter.js";
import { krMzRfAdapter } from "./adapters/kr-mz-rf.adapter.js";
import { staticCorpusAdapter } from "./adapters/static-corpus.adapter.js";
import { clinicalTrialsAdapter } from "./adapters/clinical-trials.adapter.js";
import {
  dailyMedAdapter,
  openFdaAdapter,
} from "./adapters/regulatory.adapter.js";
import { niceAdapter, whoAdapter, emaAdapter } from "./adapters/external-guidelines.adapter.js";
import { enrichRecordsWithCrossref } from "./adapters/crossref.adapter.js";
import type { EvidenceAdapter } from "./adapters/types.js";
import { emptyCorpusMessage, providersForCorpusMode } from "./corpus-mode.js";
import { dedupeEvidenceRecords } from "./dedup.js";
import { createMemoryCacheStore } from "./infra/cache.js";
import { rankEvidenceRecords, evidenceStrengthFromRecords } from "./ranker.js";
import type {
  AssistantAnswer,
  CacheStore,
  EvidenceCorpusMode,
  EvidenceProviderId,
  EvidenceSearchQuery,
  ProviderSearchResult,
  RetrievalConfig,
  UnifiedSearchResult,
} from "./types.js";

export const ALL_ADAPTERS: EvidenceAdapter[] = [
  staticCorpusAdapter,
  krMzRfAdapter,
  pubmedAdapter,
  europePmcAdapter,
  cochraneAdapter,
  semanticScholarAdapter,
  clinicalTrialsAdapter,
  openFdaAdapter,
  dailyMedAdapter,
  emaAdapter,
  whoAdapter,
  niceAdapter,
];

export const DEFAULT_ENABLED_PROVIDERS: EvidenceProviderId[] = [
  "static_corpus",
  "kr_mz_rf",
  "who",
  "nice",
  "ema",
  "pubmed",
  "europe_pmc",
  "cochrane",
  "semantic_scholar",
  "clinical_trials",
];

function resolveAdapters(
  query: EvidenceSearchQuery,
  config: RetrievalConfig,
): EvidenceAdapter[] {
  const corpusProviders = providersForCorpusMode(query.corpusMode);
  if (corpusProviders?.length) {
    return ALL_ADAPTERS.filter((a) => corpusProviders.includes(a.id));
  }
  const enabled = new Set(config.enabledProviders ?? DEFAULT_ENABLED_PROVIDERS);
  if (query.providers?.length) {
    return ALL_ADAPTERS.filter((a) => query.providers!.includes(a.id));
  }
  return ALL_ADAPTERS.filter((a) => enabled.has(a.id));
}

async function runAdapterWithTimeout(
  adapter: EvidenceAdapter,
  query: EvidenceSearchQuery,
  ctx: { config: RetrievalConfig; cache: CacheStore; signal?: AbortSignal },
): Promise<ProviderSearchResult> {
  const timeoutMs = ctx.config.adapterTimeoutMs ?? 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const signal = ctx.signal ? AbortSignal.any([ctx.signal, controller.signal]) : controller.signal;

  try {
    return await adapter.search(query, { ...ctx, signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      provider: adapter.id,
      status: message.includes("Abort") ? "timeout" : "error",
      records: [],
      error: message,
      latencyMs: timeoutMs,
    };
  } finally {
    clearTimeout(timer);
  }
}

export type SearchOrchestratorOptions = {
  config?: RetrievalConfig;
  cache?: CacheStore;
  signal?: AbortSignal;
  enrichCrossref?: boolean;
};

export async function searchEvidenceUnified(
  query: EvidenceSearchQuery,
  options: SearchOrchestratorOptions = {},
): Promise<UnifiedSearchResult> {
  const config: RetrievalConfig = {
    adapterTimeoutMs: 8000,
    maxRecordsPerProvider: 12,
    ncbiApiKey: options.config?.ncbiApiKey,
    ncbiBaseUrl: options.config?.ncbiBaseUrl,
    semanticScholarApiKey: options.config?.semanticScholarApiKey,
    crossrefMailto: options.config?.crossrefMailto,
    enabledProviders: options.config?.enabledProviders,
    ...options.config,
  };

  const cache = options.cache ?? createMemoryCacheStore();
  const ctx = { config, cache, signal: options.signal };
  const adapters = resolveAdapters(query, config);

  const settled = await Promise.all(
    adapters.map((adapter) => runAdapterWithTimeout(adapter, query, ctx)),
  );

  let allRecords = settled.flatMap((r) => r.records);
  const totalBeforeDedup = allRecords.length;

  if (options.enrichCrossref !== false) {
    allRecords = await enrichRecordsWithCrossref(allRecords, ctx);
  }

  const deduped = dedupeEvidenceRecords(allRecords);
  const ranked = rankEvidenceRecords(deduped, {
    maxAgeYears: query.maxAgeYears,
    preferHighEvidence: query.preferHighEvidence,
  });

  const limit = query.limit ?? 25;
  return {
    query: query.query,
    records: ranked.slice(0, limit),
    providers: settled,
    totalBeforeDedup,
    searchedAt: new Date().toISOString(),
  };
}

const EBM_DISCLAIMER =
  "Справочная информация (CDS). Не заменяет клиническое суждение врача. Проверяйте первоисточники и локальные протоколы.";

/** Rule-based synthesis when LLM is unavailable (web layer may override with OpenRouter). */
export function synthesizeEvidenceAnswer(
  query: string,
  searchResult: UnifiedSearchResult,
  options?: { corpusMode?: EvidenceCorpusMode },
): AssistantAnswer {
  const resolvedMode = options?.corpusMode;
  const citations = searchResult.records.slice(0, 12);
  const { strength, gradeLabel } =
    citations.length === 0
      ? { strength: "insufficient" as const, gradeLabel: "Недостаточно данных" }
      : evidenceStrengthFromRecords(citations);

  const guidelines = citations
    .filter((c) => c.recordType === "guideline" || c.provider === "kr_mz_rf")
    .slice(0, 5)
    .map((c) => ({
      title: c.title,
      url: c.url,
      org: c.provider === "kr_mz_rf" ? "МЗ РФ" : c.journal || c.provider,
      section: c.section,
    }));

  const topSummaries = citations
    .slice(0, 5)
    .map((c, i) => {
      const section = c.section ? ` · ${c.section}` : "";
      const quote = c.quote ? `\n   «${c.quote}»` : "";
      return `${i + 1}. ${c.title}${c.year ? ` (${c.year})` : ""}${section}${quote}`;
    })
    .join("\n");

  const drugRecords = citations.filter((c) => c.recordType === "drug_label");
  const recommendations: string[] = [];
  const contraindications: string[] = [];

  if (citations.length === 0) {
    // Honest empty: no invented recommendations
  } else if (drugRecords.length > 0) {
    recommendations.push("Сверьте дозировку и показания с официальной инструкцией (FDA/DailyMed).");
    if (drugRecords[0]?.abstract?.toLowerCase().includes("pregnan")) {
      contraindications.push("Проверьте раздел pregnancy/lactation в label — см. цитаты.");
    }
  }

  if (guidelines.length > 0) {
    recommendations.push(`Ориентируйтесь на действующие КР/НПА (${guidelines.length} найдено) — см. разделы в цитатах.`);
  }

  if (recommendations.length === 0 && citations.length > 0) {
    recommendations.push("Используйте цитированные источники для принятия решения; приоритет — обзоры и КР.");
  }

  const summary =
    citations.length === 0
      ? emptyCorpusMessage(query, resolvedMode)
      : `По запросу «${query}» найдено ${citations.length} релевантных источников (${gradeLabel}).\n\nКлючевые источники:\n${topSummaries}`;

  const sourcesUsed: AssistantAnswer["sourcesUsed"] = {};
  for (const p of searchResult.providers) {
    sourcesUsed[p.provider] = p.status;
  }

  return {
    query,
    summary,
    evidenceStrength: strength,
    gradeLabel,
    recommendations,
    contraindications,
    alternatives: [],
    citations,
    guidelines,
    disclaimers: [EBM_DISCLAIMER],
    sourcesUsed,
    searchedAt: searchResult.searchedAt,
    synthesisMode: "rules",
    corpusMode: resolvedMode,
  };
}

export async function askEvidenceAssistant(
  query: string,
  options: SearchOrchestratorOptions & { limit?: number; corpusMode?: EvidenceCorpusMode } = {},
): Promise<AssistantAnswer> {
  const corpusMode = options.corpusMode ?? "all";
  const searchResult = await searchEvidenceUnified(
    {
      query,
      limit: options.limit ?? 25,
      preferHighEvidence: true,
      maxAgeYears: 10,
      corpusMode,
    },
    options,
  );
  return synthesizeEvidenceAnswer(query, searchResult, { corpusMode });
}

export function getAdapterCatalog(): { id: EvidenceProviderId; label: string }[] {
  return ALL_ADAPTERS.map((a) => ({ id: a.id, label: a.label }));
}
