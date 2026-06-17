import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";
import {
  swedeRiskEmoji,
  type ColposcopyProtocolInput,
  type SwedeScoreResult,
} from "@repo/medical-calculations/colposcopy";

const DISCLAIMER =
  "Документ сформирован в SonoGyn Pro. Не является юридически заверенной медицинской записью без подписи врача. Интерпретация — за лечащим специалистом.";

export function buildColposcopyDocumentBundle(input: {
  protocol: ColposcopyProtocolInput;
  result: SwedeScoreResult;
  clinicalText: string;
  patientText: string;
  conclusionText: string;
  examinedAt?: Date;
}): {
  clinicalSpec: ClinicalDocumentSpec;
  patientSpec: ClinicalDocumentSpec;
  oneLinerSpec: ClinicalDocumentSpec;
} {
  const date = (input.examinedAt ?? new Date()).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const meta = [
    { label: "Дата", value: date },
    ...(input.protocol.patientName.trim()
      ? [{ label: "Пациентка", value: input.protocol.patientName.trim() }]
      : []),
    ...(input.protocol.patientAge.trim() ? [{ label: "Возраст", value: `${input.protocol.patientAge} лет` }] : []),
    { label: "Swede Score", value: `${input.result.total} / 10` },
    { label: "Риск", value: input.result.riskLabel },
    ...(input.protocol.physicianName.trim()
      ? [{ label: "Врач", value: input.protocol.physicianName.trim() }]
      : []),
    ...(input.protocol.institution.trim()
      ? [{ label: "Учреждение", value: input.protocol.institution.trim() }]
      : []),
  ];

  const oneLiner = `Swede Score ${input.result.total}/10 — ${input.result.riskLabel}. ${input.result.recommendation}`;

  return {
    clinicalSpec: {
      filenameBase: `colposcopy-clinical-${input.result.total}`,
      title: "Протокол кольпоскопии · Swede Score",
      meta,
      sections: [
        { heading: "Заключение", body: input.conclusionText || oneLiner },
        { heading: "Протокол осмотра", body: input.clinicalText },
      ],
      disclaimer: DISCLAIMER,
    },
    patientSpec: {
      filenameBase: `colposcopy-patient-${input.result.total}`,
      title: "Кольпоскопия · лист для пациентки",
      meta: meta.filter((m) => !["Врач", "Учреждение"].includes(m.label)),
      sections: [{ heading: "Результат", body: input.patientText }],
      disclaimer: "Информационный лист. Не является диагнозом.",
    },
    oneLinerSpec: {
      filenameBase: `colposcopy-oneliner-${input.result.total}`,
      title: "Кольпоскопия · строка в протокол",
      meta: meta.slice(0, 4),
      sections: [{ body: oneLiner }],
      disclaimer: DISCLAIMER,
    },
  };
}

export function riskBannerClass(level: SwedeScoreResult["riskLevel"]): string {
  if (level === "low") return "border-emerald-300 bg-emerald-50";
  if (level === "moderate") return "border-amber-300 bg-amber-50";
  return "border-rose-300 bg-rose-50";
}

export function riskEmoji(level: SwedeScoreResult["riskLevel"]): string {
  return swedeRiskEmoji(level);
}
