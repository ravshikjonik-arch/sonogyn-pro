import type { AssistantAnswer, EvidenceClaim, EvidenceRecord } from "./types.js";

const MAX_CLAIMS = 12;

/** Enrich citation display metadata used by UI / eval (non-breaking optional fields). */
export function citationOrg(record: EvidenceRecord): string {
  if (record.provider === "kr_mz_rf") return "МЗ РФ";
  if (record.provider === "rf_regulation") return "НПА РФ";
  if (record.provider === "who") return "WHO";
  if (record.provider === "nice") return "NICE";
  if (record.provider === "ema") return "EMA";
  if (record.journal?.trim()) return record.journal.trim();
  return record.provider;
}

export function citationLocale(record: EvidenceRecord): string {
  if (record.language?.trim()) return record.language.trim();
  if (record.provider === "kr_mz_rf" || record.provider === "rf_regulation") return "ru";
  return "en";
}

/**
 * Build claims from rule-based synthesis: quotes/sections → sourced; soft tips → inference.
 */
export function buildRulesClaims(
  citations: EvidenceRecord[],
  recommendations: string[],
): EvidenceClaim[] {
  if (citations.length === 0) return [];

  const claims: EvidenceClaim[] = [];

  citations.forEach((c, index) => {
    if (c.quote?.trim()) {
      claims.push({
        text: c.section ? `${c.section}: ${c.quote.trim()}` : c.quote.trim(),
        kind: "sourced",
        citationIndexes: [index],
      });
    } else if (c.section?.trim()) {
      claims.push({
        text: `Раздел источника: ${c.section.trim()} (${c.title})`,
        kind: "sourced",
        citationIndexes: [index],
      });
    }
  });

  for (const rec of recommendations) {
    const trimmed = rec.trim();
    if (!trimmed) continue;
    // Recommendations that only point at citations stay inference (navigation, not a fact claim).
    claims.push({
      text: trimmed,
      kind: "inference",
      citationIndexes: [],
    });
  }

  return claims.slice(0, MAX_CLAIMS);
}

/** Drop invalid LLM claim indexes; coerce unknown kinds to inference. */
export function normalizeClaims(
  raw: unknown,
  citationCount: number,
): EvidenceClaim[] {
  if (!Array.isArray(raw) || citationCount <= 0) return [];

  const out: EvidenceClaim[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const text = typeof row.text === "string" ? row.text.trim() : "";
    if (!text) continue;
    const kind: EvidenceClaim["kind"] = row.kind === "sourced" ? "sourced" : "inference";
    const indexes = Array.isArray(row.citationIndexes)
      ? row.citationIndexes
          .filter((n): n is number => typeof n === "number" && Number.isInteger(n))
          .filter((n) => n >= 0 && n < citationCount)
      : [];

    if (kind === "sourced" && indexes.length === 0) {
      // Unsourced "sourced" → demote to inference (never fake a citation).
      out.push({ text, kind: "inference", citationIndexes: [] });
      continue;
    }

    out.push({ text, kind, citationIndexes: indexes });
    if (out.length >= MAX_CLAIMS) break;
  }
  return out;
}

export function withClaims(answer: AssistantAnswer, claims: EvidenceClaim[]): AssistantAnswer {
  const insufficient =
    answer.citations.length === 0 || answer.evidenceStrength === "insufficient";
  return {
    ...answer,
    claims: insufficient ? [] : claims,
    insufficient,
  };
}

/** Eval helper: every sourced claim must have ≥1 valid index. */
export function assertClaimsConsistent(answer: AssistantAnswer): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (answer.insufficient || answer.citations.length === 0) {
    if ((answer.claims?.length ?? 0) > 0) {
      errors.push("insufficient answer must not carry claims");
    }
    return { ok: errors.length === 0, errors };
  }
  for (const [i, claim] of (answer.claims ?? []).entries()) {
    if (claim.kind === "sourced") {
      if (claim.citationIndexes.length === 0) {
        errors.push(`claim[${i}] sourced without citationIndexes`);
      }
      for (const idx of claim.citationIndexes) {
        if (idx < 0 || idx >= answer.citations.length) {
          errors.push(`claim[${i}] bad index ${idx}`);
        }
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
