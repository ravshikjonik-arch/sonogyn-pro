/** External literature / guideline provider identifier. */
export type EvidenceProviderId =
  | "pubmed"
  | "europe_pmc"
  | "semantic_scholar"
  | "crossref"
  | "cochrane"
  | "clinical_trials"
  | "kr_mz_rf"
  | "static_corpus"
  | "openfda"
  | "dailymed"
  | "who"
  | "nice"
  | "ema";

export type EvidenceRecordType =
  | "systematic_review"
  | "meta_analysis"
  | "rct"
  | "cohort"
  | "guideline"
  | "drug_label"
  | "clinical_trial"
  | "consensus"
  | "review"
  | "other";

export type EvidenceLevel = "I" | "II" | "III" | "IV" | "V";

/**
 * Corpus mode for IQDOC-like RF navigation.
 * - all: default multi-provider search
 * - rf_kr: clinical recommendations МЗ РФ only
 * - rf_npa: orders / НПА (ДЗМ, МЗ РФ)
 * - rf_all: КР + НПА + protocols (RF shelf group)
 */
export type EvidenceCorpusMode = "all" | "rf_kr" | "rf_npa" | "rf_all";

/** Unified normalized record from any provider. */
export type EvidenceRecord = {
  id: string;
  provider: EvidenceProviderId;
  sourceId: string;
  recordType: EvidenceRecordType;
  title: string;
  abstract?: string;
  authors?: string[];
  journal?: string;
  year?: number;
  doi?: string;
  pmid?: string;
  url: string;
  evidenceLevel?: EvidenceLevel;
  studyDesign?: string;
  population?: string;
  intervention?: string;
  outcome?: string;
  language?: string;
  isOpenAccess?: boolean;
  retrievedAt: string;
  relevanceScore: number;
  /** Guideline section title (RF КР/НПА). */
  section?: string;
  /** Short quote / bullet from the cited section. */
  quote?: string;
  /** Shelf from @repo/clinical-guidelines when provider is kr_mz_rf. */
  guidelineShelf?: string;
};

export type EvidenceSearchQuery = {
  query: string;
  limit?: number;
  /** Restrict to specific providers (default: all enabled). */
  providers?: EvidenceProviderId[];
  /** RF corpus modes — restrict adapters + guideline shelves. */
  corpusMode?: EvidenceCorpusMode;
  /** Prefer recent publications (years). */
  maxAgeYears?: number;
  /** Boost guidelines and systematic reviews. */
  preferHighEvidence?: boolean;
};

export type ProviderStatus = "ok" | "error" | "timeout" | "skipped" | "rate_limited";

export type ProviderSearchResult = {
  provider: EvidenceProviderId;
  status: ProviderStatus;
  records: EvidenceRecord[];
  error?: string;
  latencyMs: number;
};

export type UnifiedSearchResult = {
  query: string;
  records: EvidenceRecord[];
  providers: ProviderSearchResult[];
  totalBeforeDedup: number;
  searchedAt: string;
};

export type AssistantEvidenceStrength = "high" | "moderate" | "low" | "insufficient";

export type AssistantAnswer = {
  query: string;
  summary: string;
  evidenceStrength: AssistantEvidenceStrength;
  gradeLabel: string;
  recommendations: string[];
  contraindications: string[];
  alternatives: { name: string; rationale: string }[];
  citations: EvidenceRecord[];
  guidelines: { title: string; url: string; org: string; section?: string }[];
  disclaimers: string[];
  sourcesUsed: Partial<Record<EvidenceProviderId, ProviderStatus>>;
  searchedAt: string;
  synthesisMode: "llm" | "rules";
  /** Echo of request corpus mode (for UI empty-state copy). */
  corpusMode?: EvidenceCorpusMode;
};

export type RetrievalConfig = {
  ncbiApiKey?: string;
  ncbiBaseUrl?: string;
  semanticScholarApiKey?: string;
  crossrefMailto?: string;
  adapterTimeoutMs?: number;
  maxRecordsPerProvider?: number;
  enabledProviders?: EvidenceProviderId[];
  /** WHO/NICE/EMA rows from DB ingest or seed file. */
  externalGuidelines?: ExternalGuidelineRecord[];
};

export type ExternalGuidelineRecord = {
  source: "who" | "nice" | "ema";
  externalId: string;
  title: string;
  url: string;
  summary?: string;
  year?: number;
};

export type CacheStore = {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs: number): void;
};
