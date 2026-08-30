import type { StructuredCaseDocument } from "@repo/types";
import { emptyStructuredSection } from "@repo/types";

import { htmlToPlainText } from "@/lib/clinical-editor/html-to-plain";
import { sanitizeClinicalHtml } from "@/lib/clinical-editor/sanitize-clinical-html";
import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";
import { CASE_SECTION_DEFS } from "@/lib/structured-editor/sections";

function sectionBody(
  section: StructuredCaseDocument["sections"][keyof StructuredCaseDocument["sections"]] | undefined,
): {
  body: string;
  bodyHtml?: string;
} {
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

export function structuredCaseToDocumentSpec(input: {
  caseTitle: string;
  document: StructuredCaseDocument;
}): ClinicalDocumentSpec {
  const sections: ClinicalDocumentSpec["sections"] = [];

  for (const def of CASE_SECTION_DEFS) {
    const content = input.document.sections[def.id as keyof StructuredCaseDocument["sections"]];
    const { body, bodyHtml } = sectionBody(content);
    if (!body.trim()) continue;
    sections.push({ heading: def.title, body, bodyHtml });
  }

  if (!sections.length) {
    sections.push({ body: "Структурированный кейс без заполненных разделов." });
  }

  const algo = input.document.algorithmVersion
    ? [{ label: "Версия алгоритма", value: input.document.algorithmVersion }]
    : [];

  return {
    filenameBase: `case-${input.caseTitle}`.replace(/\s+/g, "-").slice(0, 80),
    title: input.caseTitle,
    meta: [
      { label: "Шаблон", value: input.document.templateVersion },
      ...algo,
      {
        label: "Подтверждение врачом",
        value: input.document.physicianConfirmedConclusion ? "Да" : "Нет",
      },
    ],
    sections,
    disclaimer:
      "Материал носит образовательный характер и не является медицинским диагнозом. Интерпретация — за лечащим врачом.",
  };
}
