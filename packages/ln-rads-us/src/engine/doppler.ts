import type { LnDopplerAnalysis, LnVascularity } from "../types";

const DOPPLER_MAP: Record<LnVascularity, Omit<LnDopplerAnalysis, "pattern">> = {
  hilar: {
    riskContribution: "low",
    clinicalSignificance: "Нормальный hilar паттерн — артерии/вены через ворота, ветвление в центре.",
    teachingExplanation:
      "Hilar flow соответствует сохранённой архитектуре. При реактивных узлах может быть повышен, но без peripheral dominance.",
  },
  central: {
    riskContribution: "low",
    clinicalSignificance: "Центральный кровоток без периферического доминирования.",
    teachingExplanation: "Central flow близок к hilar; оценивайте в контексте формы и hilum.",
  },
  mixed: {
    riskContribution: "intermediate",
    clinicalSignificance: "Смешанный hilar + периферический — неопределённый паттерн.",
    teachingExplanation: "Mixed flow часто при реактивных и ранних метастатических узлах; требует корреляции с морфологией.",
  },
  peripheral: {
    riskContribution: "high",
    clinicalSignificance: "Периферическая васкуляризация — подозрительный признак метастазы/лимфомы.",
    teachingExplanation: "Peripheral vessels ('rim flow') при утрате hilum — классический признак метастазы (SRU, EFSUMB).",
  },
  penetrating: {
    riskContribution: "high",
    clinicalSignificance: "Проникающие сосуды через кapsule — высокая подозрительность.",
    teachingExplanation: "Penetrating vessels + eccentric cortex → FNA, даже если узел небольшой.",
  },
  chaotic: {
    riskContribution: "high",
    clinicalSignificance: "Хаотичная неорганизованная васкуляризация.",
    teachingExplanation: "Chaotic flow при замене архитектуры — LN-RADS 4–5; дифференцировать с некrotic TBC.",
  },
  absent: {
    riskContribution: "intermediate",
    clinicalSignificance: "Отсутствие кровотока — может быть некроз или fibrotic node.",
    teachingExplanation: "Avascular zone + cystic/necrotic areas — оценивать размер и контуры; не всегда доброкачественно.",
  },
};

export function analyzeDoppler(vascularity: LnVascularity): LnDopplerAnalysis {
  const meta = DOPPLER_MAP[vascularity];
  return { pattern: vascularity, ...meta };
}

export function dopplerScoreContribution(vascularity: LnVascularity): number {
  switch (vascularity) {
    case "hilar":
    case "central":
      return 0;
    case "mixed":
      return 1;
    case "absent":
      return 1;
    case "peripheral":
    case "penetrating":
      return 3;
    case "chaotic":
      return 4;
  }
}

export const DOPPLER_OPTIONS: { value: LnVascularity; label: string }[] = [
  { value: "hilar", label: "Hilar flow" },
  { value: "central", label: "Central flow" },
  { value: "mixed", label: "Mixed flow" },
  { value: "peripheral", label: "Peripheral flow" },
  { value: "penetrating", label: "Penetrating vessels" },
  { value: "chaotic", label: "Chaotic flow" },
  { value: "absent", label: "Absent / avascular" },
];
