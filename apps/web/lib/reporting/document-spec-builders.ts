import type { UltrasoundProtocolPayload } from "@repo/types";

import { buildAssistantProtocolText } from "@/lib/clinical-assistant/build-protocol";
import type { ObgynNosologyCard } from "@/lib/clinical-assistant";
import type { ClinicalDocumentSpec } from "./clinical-document";
import type { PdfReportInput } from "./generateStudyPdf";

export function assistantCardToDocumentSpec(card: ObgynNosologyCard): ClinicalDocumentSpec {
  const text = buildAssistantProtocolText(card);
  return {
    filenameBase: `assistant-${card.code}-${card.id}`,
    title: `Маршрут помощника · ${card.code} · ${card.title}`,
    meta: [
      { label: "Нозология", value: card.title },
      { label: "Группа", value: card.group },
    ],
    sections: [{ body: text }],
  };
}

export function plainTextToDocumentSpec(input: {
  filenameBase: string;
  title: string;
  meta?: { label: string; value: string }[];
  text: string;
  sectionHeading?: string;
}): ClinicalDocumentSpec {
  return {
    filenameBase: input.filenameBase,
    title: input.title,
    meta: input.meta,
    sections: [{ heading: input.sectionHeading, body: input.text }],
  };
}

export function studyProtocolToDocumentSpec(input: PdfReportInput): ClinicalDocumentSpec {
  const { patientLabel, studyTitle, studyDate, physicianName, protocol } = input;
  const b = protocol.biometry;
  const biometryLines = [
    `КТР: ${fmt(b.crl_mm)}`,
    `БПР: ${fmt(b.bpd_mm)}`,
    `ОГ: ${fmt(b.hc_mm)}`,
    `ОЖ: ${fmt(b.ac_mm)}`,
    `ДБ: ${fmt(b.fl_mm)}`,
    `ДП: ${fmt(b.hl_mm)}`,
    protocol.efw_grams ? `EFW: ${protocol.efw_grams} г (${protocol.efw_formula ?? "—"})` : null,
    protocol.ga_days != null ? `Срок: ${protocol.ga_days} дн.` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const organLines = Object.entries(protocol.organs ?? {})
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => `${organRu(k)}:\n${v}`)
    .join("\n\n");

  const sections: ClinicalDocumentSpec["sections"] = [];
  if (biometryLines) sections.push({ heading: "Фетометрия", body: biometryLines });
  if (organLines) sections.push({ heading: "Описание", body: organLines });
  if (protocol.diagnosis?.trim()) sections.push({ heading: "Диагноз", body: protocol.diagnosis.trim() });
  if (protocol.conclusion?.trim()) sections.push({ heading: "Заключение", body: protocol.conclusion.trim() });
  if (!sections.length) sections.push({ body: "Протокол без заполненных полей." });

  return {
    filenameBase: `protocol-${patientLabel}`.replace(/\s+/g, "-"),
    title: "Протокол ультразвукового исследования",
    meta: [
      { label: "Пациент", value: patientLabel },
      { label: "Исследование", value: studyTitle },
      { label: "Дата", value: studyDate },
      ...(physicianName ? [{ label: "Врач", value: physicianName }] : []),
    ],
    sections,
  };
}

function fmt(v?: number) {
  return v != null && Number.isFinite(v) ? `${v} мм` : "—";
}

function organRu(key: string) {
  const map: Record<string, string> = {
    uterus: "Матка",
    ovaries: "Яичники",
    cervix: "Шейка матки",
    placenta: "Плацента",
    fetus: "Плод",
    bladder: "Мочевой пузырь",
  };
  return map[key] ?? key;
}
