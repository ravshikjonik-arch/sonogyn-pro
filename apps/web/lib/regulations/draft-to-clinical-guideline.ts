import type { ClinicalGuideline } from "@repo/clinical-guidelines";

import type { RegulationExtractionEnvelope } from "./extraction-schema";

function slugifyId(title: string, queueId: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `ingest-${base || "doc"}-${queueId.slice(0, 8)}`;
}

export function draftEnvelopeToClinicalGuideline(
  envelope: RegulationExtractionEnvelope,
  meta: { queueId: string; sourceUrl: string; publishedAt?: string },
): ClinicalGuideline {
  const { draft } = envelope;
  const recBullets = draft.recommendations.map(
    (r) => `${r.clinical_guideline}${r.evidence_level !== "unknown" ? ` (ур. ${r.evidence_level})` : ""}`,
  );
  const sections: ClinicalGuideline["sections"] = [];
  if (draft.relevantSections.length > 0) {
    sections.push({ title: "Релевантные разделы", bullets: draft.relevantSections });
  }
  if (recBullets.length > 0) {
    sections.push({ title: "Клинические рекомендации (извлечено AI, review)", bullets: recBullets });
  }
  if (draft.protocolChanges.length > 0) {
    sections.push({ title: "Изменения протоколов УЗД", bullets: draft.protocolChanges });
  }
  if (draft.contraindications.length > 0) {
    sections.push({ title: "Ограничения и противопоказания", bullets: draft.contraindications });
  }

  const tags = [
    ...new Set(
      [
        draft.specialty,
        draft.documentKind,
        draft.documentNumber,
        ...draft.recommendations.flatMap((r) => r.applicable_to),
      ].filter(Boolean) as string[],
    ),
  ].slice(0, 12);

  return {
    id: slugifyId(draft.title, meta.queueId),
    title: draft.title,
    summary: draft.summary,
    shelf: draft.shelf,
    documentKind: draft.documentKind,
    issuer: draft.issuer,
    specialty: draft.specialty,
    year: draft.year ?? new Date().getFullYear(),
    status: "active",
    officialUrl: draft.officialUrl ?? meta.sourceUrl,
    documentNumber: draft.documentNumber,
    sections: sections.length > 0 ? sections : undefined,
    tags,
    relatedNosologyIds: draft.relatedNosologyIds.length > 0 ? draft.relatedNosologyIds : undefined,
    revisedAt: meta.publishedAt ?? new Date().toISOString().slice(0, 10),
  };
}

export function clinicalGuidelineToTsModule(guideline: ClinicalGuideline): string {
  return `/** Auto-export from regulation ingest — verify before merge */\nexport const guideline = ${JSON.stringify(guideline, null, 2)} as const;\n`;
}

export function externalIndexRowFromGuideline(
  guideline: ClinicalGuideline,
  queueId: string,
): { source: string; external_id: string; title: string; url: string; body_text: string; published_at: string } {
  const body = [
    guideline.summary,
    ...(guideline.sections?.flatMap((s) => s.bullets) ?? []),
  ].join("\n");
  return {
    source: "rf_regulation",
    external_id: guideline.id,
    title: guideline.title,
    url: guideline.officialUrl ?? "https://cr.minzdrav.gov.ru/",
    body_text: body.slice(0, 50_000),
    published_at: new Date().toISOString(),
  };
}
