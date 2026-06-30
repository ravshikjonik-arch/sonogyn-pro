import type { EvidenceRecord, EvidenceRecordType } from "./types.js";

const TYPE_WEIGHT: Record<EvidenceRecordType, number> = {
  meta_analysis: 1,
  systematic_review: 0.98,
  guideline: 0.95,
  rct: 0.88,
  clinical_trial: 0.82,
  drug_label: 0.8,
  cohort: 0.72,
  review: 0.65,
  consensus: 0.6,
  other: 0.45,
};

const PROVIDER_BOOST: Partial<Record<EvidenceRecord["provider"], number>> = {
  cochrane: 0.08,
  kr_mz_rf: 0.07,
  static_corpus: 0.06,
  pubmed: 0.03,
  europe_pmc: 0.03,
  semantic_scholar: 0.02,
};

export function rankEvidenceRecords(
  records: EvidenceRecord[],
  options?: { maxAgeYears?: number; preferHighEvidence?: boolean },
): EvidenceRecord[] {
  const nowYear = new Date().getFullYear();
  const maxAge = options?.maxAgeYears ?? 15;
  const preferHigh = options?.preferHighEvidence !== false;

  return records
    .map((record) => {
      let score = record.relevanceScore;

      if (preferHigh) {
        score = score * 0.55 + (TYPE_WEIGHT[record.recordType] ?? 0.4) * 0.45;
      }

      if (record.year) {
        const age = nowYear - record.year;
        if (age <= 3) score += 0.08;
        else if (age <= 5) score += 0.05;
        else if (age > maxAge) score -= 0.15;
      }

      if (record.abstract) score += 0.04;
      if (record.isOpenAccess) score += 0.02;
      score += PROVIDER_BOOST[record.provider] ?? 0;

      return { ...record, relevanceScore: Math.min(1, Math.max(0, score)) };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export function evidenceStrengthFromRecords(records: EvidenceRecord[]): {
  strength: "high" | "moderate" | "low" | "insufficient";
  gradeLabel: string;
} {
  if (records.length === 0) {
    return { strength: "insufficient", gradeLabel: "Недостаточно данных" };
  }

  const top = records.slice(0, 8);
  const hasMeta = top.some((r) => r.recordType === "meta_analysis" || r.recordType === "systematic_review");
  const hasGuideline = top.some((r) => r.recordType === "guideline");
  const hasRct = top.some((r) => r.recordType === "rct");
  const recent = top.some((r) => r.year && r.year >= new Date().getFullYear() - 5);

  if (hasMeta && (hasGuideline || hasRct)) {
    return { strength: "high", gradeLabel: "Высокая — систематические обзоры / КР" };
  }
  if (hasMeta || hasGuideline || (hasRct && recent)) {
    return { strength: "moderate", gradeLabel: "Умеренная — РКИ / обзоры / КР" };
  }
  if (top.length >= 3) {
    return { strength: "low", gradeLabel: "Низкая — ограниченные первичные данные" };
  }
  return { strength: "insufficient", gradeLabel: "Недостаточно источников" };
}
