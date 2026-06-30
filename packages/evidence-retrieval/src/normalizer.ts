import type { EvidenceProviderId, EvidenceRecord, EvidenceRecordType } from "./types.js";

export function stableRecordId(provider: EvidenceProviderId, sourceId: string): string {
  return `${provider}:${sourceId}`;
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferRecordType(hints: {
  title?: string;
  publicationTypes?: string[];
  provider?: EvidenceProviderId;
}): EvidenceRecordType {
  const blob = [hints.title ?? "", ...(hints.publicationTypes ?? [])].join(" ").toLowerCase();

  if (hints.provider === "kr_mz_rf" || hints.provider === "who" || hints.provider === "nice") {
    return "guideline";
  }
  if (hints.provider === "openfda" || hints.provider === "dailymed" || hints.provider === "ema") return "drug_label";
  if (hints.provider === "clinical_trials") return "clinical_trial";
  if (blob.includes("meta-analysis") || blob.includes("meta analysis")) return "meta_analysis";
  if (blob.includes("systematic review") || hints.provider === "cochrane") return "systematic_review";
  if (blob.includes("randomized") || blob.includes("randomised") || blob.includes("rct")) return "rct";
  if (blob.includes("cohort")) return "cohort";
  if (blob.includes("consensus") || blob.includes("guideline")) return "guideline";
  if (blob.includes("review")) return "review";
  return "other";
}

export function mapRecordTypeToLevel(type: EvidenceRecordType): EvidenceRecord["evidenceLevel"] {
  switch (type) {
    case "meta_analysis":
    case "systematic_review":
      return "I";
    case "rct":
      return "II";
    case "cohort":
    case "clinical_trial":
      return "III";
    case "guideline":
      return "I";
    case "drug_label":
      return "I";
    case "consensus":
      return "IV";
    case "review":
      return "III";
    default:
      return "V";
  }
}

export function buildEvidenceRecord(input: {
  provider: EvidenceProviderId;
  sourceId: string;
  title: string;
  abstract?: string;
  authors?: string[];
  journal?: string;
  year?: number;
  doi?: string;
  pmid?: string;
  url: string;
  recordType?: EvidenceRecordType;
  publicationTypes?: string[];
  isOpenAccess?: boolean;
  relevanceScore?: number;
  studyDesign?: string;
  population?: string;
  intervention?: string;
  outcome?: string;
}): EvidenceRecord {
  const recordType =
    input.recordType ??
    inferRecordType({
      title: input.title,
      publicationTypes: input.publicationTypes,
      provider: input.provider,
    });

  return {
    id: stableRecordId(input.provider, input.sourceId),
    provider: input.provider,
    sourceId: input.sourceId,
    recordType,
    title: input.title.trim(),
    abstract: input.abstract?.trim() || undefined,
    authors: input.authors?.length ? input.authors : undefined,
    journal: input.journal?.trim() || undefined,
    year: input.year,
    doi: input.doi?.trim() || undefined,
    pmid:
      input.pmid?.replace(/\D/g, "") ||
      (input.provider === "pubmed" ? input.sourceId.replace(/\D/g, "") || undefined : undefined),
    url: input.url,
    evidenceLevel: mapRecordTypeToLevel(recordType),
    studyDesign: input.studyDesign,
    population: input.population,
    intervention: input.intervention,
    outcome: input.outcome,
    isOpenAccess: input.isOpenAccess,
    retrievedAt: new Date().toISOString(),
    relevanceScore: input.relevanceScore ?? 0.5,
  };
}
