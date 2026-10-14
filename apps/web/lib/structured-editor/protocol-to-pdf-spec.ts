import type { StructuredProtocolDraft } from "@repo/types";
import { emptyStructuredSection } from "@repo/types";

import { htmlToPlainText } from "@/lib/clinical-editor/html-to-plain";
import { sanitizeClinicalHtml } from "@/lib/clinical-editor/sanitize-clinical-html";
import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";
import { PROTOCOL_SECTION_DEFS } from "@/lib/structured-editor/sections";

function sectionBody(
  section: StructuredProtocolDraft["sections"][keyof StructuredProtocolDraft["sections"]] | undefined,
): { body: string; bodyHtml?: string } {
  const safe = section ?? emptyStructuredSection();
  const blockLines = (safe.blocks ?? []).map(
    (b) => `${b.system} · ${b.category}\n${b.summary}\nИсточник: ${b.sourceLabel} (${b.algorithmVersion})`,
  );
  const plainParts = [safe.plain?.trim(), ...blockLines].filter(Boolean);
  const plain = plainParts.join("\n\n");
  const html = safe.html?.trim() ? sanitizeClinicalHtml(safe.html) : undefined;
  return {
    body: plain || (html ? htmlToPlainText(html) : ""),
    bodyHtml: html,
  };
}

export function structuredProtocolToDocumentSpec(input: {
  studyLabel: string;
  draft: StructuredProtocolDraft;
}): ClinicalDocumentSpec {
  const sections: ClinicalDocumentSpec["sections"] = [];

  for (const def of PROTOCOL_SECTION_DEFS) {
    const content = input.draft.sections[def.id as keyof StructuredProtocolDraft["sections"]];
    const { body, bodyHtml } = sectionBody(content);
    if (!body.trim()) continue;
    sections.push({ heading: def.title, body, bodyHtml });
  }

  if (!sections.length) {
    sections.push({ body: "Структурированный черновик протокола без заполненных разделов." });
  }

  const meta: ClinicalDocumentSpec["meta"] = [
    { label: "Шаблон", value: input.draft.templateVersion },
    {
      label: "Подтверждение врачом",
      value: input.draft.physicianConfirmedConclusion ? "Да" : "Нет",
    },
  ];

  if (input.draft.scaleSource?.trim()) {
    meta.push({ label: "Источник шкалы", value: input.draft.scaleSource.trim() });
  }
  if (input.draft.algorithmVersion?.trim()) {
    meta.push({ label: "Версия алгоритма", value: input.draft.algorithmVersion.trim() });
  }
  if (input.draft.algorithmDate?.trim()) {
    meta.push({ label: "Дата алгоритма", value: input.draft.algorithmDate.trim() });
  }

  return {
    filenameBase: `protocol-${input.studyLabel}`.replace(/\s+/g, "-").slice(0, 80),
    title: `Протокол УЗИ · ${input.studyLabel}`,
    meta,
    sections,
    disclaimer:
      "Черновик протокола. Не является медицинским диагнозом. Финальное заключение подтверждает лечащий врач.",
  };
}
