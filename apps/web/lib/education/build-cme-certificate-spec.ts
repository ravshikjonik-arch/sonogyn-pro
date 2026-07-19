import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";

export type CmeCertificateEntry = {
  title: string;
  hours: number;
  date: string;
  source: string;
};

export function buildCmeCertificateSpec(
  entries: CmeCertificateEntry[],
  options?: { physicianName?: string; totalTargetHours?: number },
): ClinicalDocumentSpec | null {
  if (!entries.length) return null;

  const total = entries.reduce((n, e) => n + e.hours, 0);
  const target = options?.totalTargetHours ?? 36;
  const lines = entries.map((e) => `• ${e.date} — ${e.title} (${e.hours} ч) · ${e.source}`);

  const body = [
    "Справка об образовательной активности на платформе SonoGyn Pro.",
    "",
    `Суммарно: ${total.toFixed(1)} академических часов (ориентир программы: ${target} ч).`,
    "",
    "Пройденные активности:",
    ...lines,
    "",
    "Примечание: документ сформирован автоматически из локального журнала CME-трекера.",
    "Не является официальным документом НМО без подписи учреждения и печати.",
  ].join("\n");

  return plainTextToDocumentSpec({
    filenameBase: `sonogyn-cme-certificate-${new Date().toISOString().slice(0, 10)}`,
    title: "Справка о прохождении обучения · SonoGyn Pro CME",
    meta: [
      { label: "Дата выдачи", value: new Date().toLocaleDateString("ru-RU") },
      { label: "Часов", value: `${total.toFixed(1)}` },
      ...(options?.physicianName?.trim()
        ? [{ label: "Врач", value: options.physicianName.trim() }]
        : []),
      { label: "Платформа", value: "SonoGyn Pro · sonogyn-pro.ru" },
    ],
    sectionHeading: "Журнал активностей",
    text: body,
  });
}
