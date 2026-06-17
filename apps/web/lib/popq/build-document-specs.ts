import type { ClinicalDocumentSpec } from "@/lib/reporting/clinical-document";
import {
  POPQ_STAGE_RULES_RU,
  compartmentLabel,
  stageLabel,
  type PopQInput,
  type PopQStageResult,
} from "@repo/medical-calculations/popq";

export type PopQDocumentBundleInput = {
  uterusPresent: boolean;
  points: PopQInput;
  stageResult: PopQStageResult;
  protocolLine: string;
  patientReport: string;
  clinicalProtocol: string;
  physicianName?: string;
  institution?: string;
  patientLabel?: string;
  conclusionDraft?: string;
  examinedAt?: Date;
};

export type PopQDocumentBundle = {
  clinicalSpec: ClinicalDocumentSpec;
  patientSpec: ClinicalDocumentSpec;
  oneLinerSpec: ClinicalDocumentSpec;
};

const POPQ_DISCLAIMER =
  "Документ сформирован в SonoGyn Pro по шкале POP-Q. Не является юридически заверенной медицинской записью без подписи врача и печати учреждения. Не заменяет очное заключение специалиста. Интерпретация и тактика — за лечащим врачом.";

function formatExamDate(examinedAt?: Date): string {
  const d = examinedAt ?? new Date();
  return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
}

function baseMeta(input: PopQDocumentBundleInput): { label: string; value: string }[] {
  const { stageResult, uterusPresent, points } = input;
  return [
    { label: "Дата осмотра", value: formatExamDate(input.examinedAt) },
    ...(input.patientLabel?.trim() ? [{ label: "Пациентка", value: input.patientLabel.trim() }] : []),
    { label: "Стадия", value: stageLabel(stageResult.stageKey) },
    {
      label: "Самая низкая точка",
      value: stageResult.maxPoint != null ? `${stageResult.maxPoint} см` : "—",
    },
    {
      label: "Ведущий отдел",
      value: stageResult.leading ? compartmentLabel(stageResult.leading.key) : "—",
    },
    {
      label: "Контекст",
      value: uterusPresent ? "Матка сохранена" : "После гистерэктомии",
    },
    ...(points.TVL != null ? [{ label: "TVL", value: `${points.TVL} см` }] : []),
    ...(input.physicianName?.trim() ? [{ label: "Врач", value: input.physicianName.trim() }] : []),
    ...(input.institution?.trim() ? [{ label: "Учреждение", value: input.institution.trim() }] : []),
  ];
}

function stagingRulesBlock(): string {
  return ["Правила стадирования POP-Q:", ...POPQ_STAGE_RULES_RU.map((r) => `• ${r}`)].join("\n");
}

export function buildPopQDocumentBundle(input: PopQDocumentBundleInput): PopQDocumentBundle {
  const meta = baseMeta(input);
  const stageKey = input.stageResult.stageKey;

  const clinicalSections: ClinicalDocumentSpec["sections"] = [
    { heading: "Строка для протокола", body: input.protocolLine },
    { heading: "Протокол осмотра", body: input.clinicalProtocol },
  ];
  if (input.conclusionDraft?.trim()) {
    clinicalSections.push({
      heading: "Дополнительное заключение врача",
      body: input.conclusionDraft.trim(),
    });
  }
  clinicalSections.push({ heading: "Справочно", body: stagingRulesBlock() });

  const patientSections: ClinicalDocumentSpec["sections"] = [
    { heading: "Результат осмотра", body: input.patientReport },
    {
      heading: "Что это значит",
      body:
        input.stageResult.stageDescription +
        "\n\nШкала POP-Q — международный стандарт описания пролапса. Тактика лечения определяется вашим врачом с учётом жалоб и общего состояния.",
    },
  ];

  return {
    clinicalSpec: {
      filenameBase: `popq-clinical-stage-${stageKey}`,
      title: "POP-Q · протокол осмотра для медицинской документации",
      meta,
      sections: clinicalSections,
      disclaimer: POPQ_DISCLAIMER,
    },
    patientSpec: {
      filenameBase: `popq-patient-stage-${stageKey}`,
      title: "POP-Q · лист для пациентки",
      meta: meta.filter((m) => !["Врач", "Учреждение"].includes(m.label)),
      sections: patientSections,
      disclaimer:
        "Информационный лист. Не является диагнозом. Решения о лечении принимает ваш лечащий врач.",
    },
    oneLinerSpec: {
      filenameBase: `popq-oneliner-stage-${stageKey}`,
      title: "POP-Q · строка для протокола",
      meta: meta.slice(0, 4),
      sections: [{ body: input.protocolLine }],
      disclaimer: POPQ_DISCLAIMER,
    },
  };
}
