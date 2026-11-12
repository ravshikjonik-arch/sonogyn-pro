import type { AssistantAnswer } from "@repo/evidence-retrieval/types";

import type { EvidenceSection, MiEvidenceReference } from "./contracts";

/** Output of the web evidence binding (existing search → synthesis → postValidateEvidenceAnswer). */
export type EvidenceRunResult =
  | {
      ok: true;
      answer: AssistantAnswer;
      validation: { ok: boolean; text: string; reasons: string[]; replaced: boolean };
    }
  /** `blocked`: refused by policy (e.g. quota) — reported as blocked, not as a technical failure. */
  | { ok: false; error: string; blocked?: boolean };

export const EVIDENCE_LIMITATIONS: readonly string[] = [
  "Evidence stack does not provide document version / edition",
  "Publication date is limited to the year supplied by the provider",
  "Page numbers are not provided; section and quote only when the source returns them",
  "Only retrieved sources are cited — no guideline or textbook is claimed unless it was returned",
];

const OK_STATUSES = new Set(["ok"]);

/** Maps the existing assistant answer into the MI evidence section without adding bibliographic data. */
export function buildEvidenceSection(query: string, corpusMode: string | undefined, run: EvidenceRunResult): EvidenceSection {
  if (!run.ok) {
    return { status: "failed", query, corpusMode, references: [], error: run.error, limitations: [...EVIDENCE_LIMITATIONS] };
  }
  const { answer, validation } = run;
  const providerStatuses: Record<string, string> = {};
  for (const [k, v] of Object.entries(answer.sourcesUsed ?? {})) if (v) providerStatuses[k] = v;
  const statuses = Object.values(providerStatuses);
  const allProvidersFailed = statuses.length > 0 && !statuses.some((s) => OK_STATUSES.has(s) || s === "skipped");

  const references: MiEvidenceReference[] = answer.citations.slice(0, 12).map((c, i) => ({
    index: i + 1,
    sourceId: c.sourceId,
    provider: c.provider,
    title: c.title,
    url: c.url,
    recordType: c.recordType,
    ...(c.year ? { year: c.year } : {}),
    ...(c.journal ? { journal: c.journal } : {}),
    ...(c.doi ? { doi: c.doi } : {}),
    ...(c.pmid ? { pmid: c.pmid } : {}),
    ...(c.section ? { section: c.section } : {}),
    ...(c.quote ? { passage: c.quote } : {}),
    ...(c.evidenceLevel ? { evidenceLevel: c.evidenceLevel } : {}),
  }));

  if (allProvidersFailed && references.length === 0) {
    return {
      status: "failed",
      query,
      corpusMode,
      references: [],
      providerStatuses,
      error: "all evidence providers failed",
      limitations: [...EVIDENCE_LIMITATIONS],
    };
  }

  const insufficient = references.length === 0 || answer.insufficient === true || answer.evidenceStrength === "insufficient";
  return {
    status: insufficient ? "insufficient" : "found",
    query,
    corpusMode,
    synthesisMode: answer.synthesisMode,
    evidenceStrength: answer.evidenceStrength,
    summary: answer.summary,
    references: insufficient ? [] : references,
    validation: { ok: validation.ok, reasons: validation.reasons, replaced: validation.replaced },
    validatedText: validation.text,
    providerStatuses,
    limitations: [...EVIDENCE_LIMITATIONS],
  };
}
