import { findPathologyById, getAllPathologies, type WoodwardPathologyEntry } from "../../medical-knowledge/index";
import { CLINICAL_RULES, type ClinicalRule } from "./clinicalRules";
import { collectAllTokens, normalizeFindings } from "./findingSynonyms";
import type {
  DifferentialInput,
  DifferentialOutput,
  DifferentialResultItem,
  FindingToken,
} from "./types";

type ScoredCandidate = {
  pathologyId: string;
  score: number;
  source: "rule" | "knowledge";
  ruleId?: string;
  supporting: string[];
  missing: string[];
  nextSteps: string[];
};

function ruleMatches(rule: ClinicalRule, tokens: FindingToken[]): boolean {
  if (rule.excludeTokens?.some((t) => tokens.includes(t))) return false;
  return rule.requiredTokens.every((t) => tokens.includes(t));
}

function applyRule(rule: ClinicalRule, tokens: FindingToken[], rawFindings: string[]): ScoredCandidate[] {
  if (!ruleMatches(rule, tokens)) return [];

  return rule.diagnoses.map((dx) => {
    const entry = findPathologyById(dx.pathologyId);
    const expected = dx.expectedTokens ?? [];
    const supportive = rawFindings.filter((f) =>
      normalizeFindings([f]).some((t) => tokens.includes(t) && expected.includes(t)),
    );
    const missing = expected
      .filter((t) => !tokens.includes(t))
      .map((t) => `Ожидается: ${t}`);

    let confidence = dx.baseConfidence;
    if (rule.supportiveTokens) {
      const bonus = rule.supportiveTokens.filter((t) => tokens.includes(t)).length * 0.05;
      confidence = Math.min(0.98, confidence + bonus);
    }
    confidence = Math.max(0.05, confidence - missing.length * 0.04);

    const nextSteps = [
      ...(rule.ruleNextSteps ?? []),
      ...(entry?.follow_up ?? []).slice(0, 3),
      ...(entry?.red_flags ?? []).slice(0, 2).map((r) => `Красный флаг: ${r}`),
    ];

    return {
      pathologyId: dx.pathologyId,
      score: confidence,
      source: "rule" as const,
      ruleId: rule.id,
      supporting: supportive.length ? supportive : rawFindings.filter((f) => normalizeFindings([f]).length > 0),
      missing,
      nextSteps: [...new Set(nextSteps)].slice(0, 8),
    };
  });
}

function scoreFromKnowledge(tokens: FindingToken[], rawFindings: string[]): ScoredCandidate[] {
  const query = rawFindings.join(" ").toLowerCase();
  if (!query.trim() && tokens.length === 0) return [];

  const out: ScoredCandidate[] = [];

  for (const entry of getAllPathologies()) {
    const corpus = buildCorpus(entry).toLowerCase();
    let hits = 0;
    const supporting: string[] = [];

    for (const token of tokens) {
      if (corpus.includes(token.replace(/_/g, " ")) || corpus.includes(token)) {
        hits += 1;
        supporting.push(token);
      }
    }

    for (const f of rawFindings) {
      const fl = f.toLowerCase();
      if (fl.length > 3 && corpus.includes(fl.slice(0, Math.min(fl.length, 24)))) {
        hits += 0.5;
        supporting.push(f);
      }
    }

    if (hits === 0) continue;

    const score = Math.min(0.75, 0.15 + hits * 0.12);
    out.push({
      pathologyId: entry.id,
      score,
      source: "knowledge",
      supporting: [...new Set(supporting)],
      missing: [],
      nextSteps: [...entry.follow_up, ...entry.genetic_associations.map((g) => `Генетика: ${g}`)].slice(0, 5),
    });
  }

  return out;
}

function buildCorpus(entry: WoodwardPathologyEntry): string {
  return [
    entry.name,
    entry.nameEn,
    entry.definition,
    ...entry.ultrasound_findings,
    ...entry.differential_diagnosis,
    ...entry.red_flags,
    ...entry.genetic_associations,
  ].join(" ");
}

function mergeCandidates(candidates: ScoredCandidate[]): ScoredCandidate[] {
  const map = new Map<string, ScoredCandidate>();

  for (const c of candidates) {
    const prev = map.get(c.pathologyId);
    if (!prev || c.score > prev.score) {
      map.set(c.pathologyId, {
        ...c,
        supporting: [...new Set([...(prev?.supporting ?? []), ...c.supporting])],
        missing: [...new Set([...(prev?.missing ?? []), ...c.missing])],
        nextSteps: [...new Set([...(prev?.nextSteps ?? []), ...c.nextSteps])],
      });
    } else if (prev) {
      prev.supporting = [...new Set([...prev.supporting, ...c.supporting])];
      prev.nextSteps = [...new Set([...prev.nextSteps, ...c.nextSteps])];
    }
  }

  return [...map.values()];
}

function toResultItem(c: ScoredCandidate): DifferentialResultItem | null {
  const entry = findPathologyById(c.pathologyId);
  if (!entry) return null;

  return {
    diagnosis: entry.name,
    diagnosisEn: entry.nameEn,
    pathologyId: entry.id,
    confidence: Math.round(c.score * 100) / 100,
    supportingFindings: c.supporting,
    missingFindings: c.missing,
    nextSteps: c.nextSteps,
    category: entry.category,
    bookPage: entry.bookPage,
  };
}

/**
 * Построить ранжированный дифференциальный диагноз по находкам.
 * Источник знаний: medical-knowledge (Woodward 4ed) + клинические правила.
 */
export function buildDifferentialDiagnosis(input: DifferentialInput): DifferentialOutput {
  const rawFindings = input.findings.filter(Boolean);
  const tokens = collectAllTokens(rawFindings, input.biometricData, input.dopplerData);

  const fromRules: ScoredCandidate[] = [];
  for (const rule of CLINICAL_RULES) {
    fromRules.push(...applyRule(rule, tokens, rawFindings));
  }

  const fromKnowledge = scoreFromKnowledge(tokens, rawFindings);
  const merged = mergeCandidates([...fromRules, ...fromKnowledge]);

  return merged
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(toResultItem)
    .filter((x): x is DifferentialResultItem => x != null);
}

/** Alias для API-модуля copilot (Этап 10). */
export function generateDifferential(input: DifferentialInput): DifferentialOutput {
  return buildDifferentialDiagnosis(input);
}

export type { DifferentialInput, DifferentialOutput, DifferentialResultItem };
