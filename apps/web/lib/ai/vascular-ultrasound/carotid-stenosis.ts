/**
 * Градация стеноза ВСА по допплеру — табл. 4.1 Куликов / Grant E.G. et al., 2003.
 * Сверять с планиметрией (ECST/NASCET) и локальным протоколом.
 */

import { EXTRACRANIAL_ARTERIAL_NORMS } from "./vascular-norms";

export type CarotidStenosisGrade = "normal" | "mild" | "moderate" | "severe" | "occlusion";

export type CarotidStenosisInput = {
  psvIcaCmS?: number | null;
  edvIcaCmS?: number | null;
  psvCcaCmS?: number | null;
  /** Морфологическая оценка % по NASCET, если известна */
  morphologicPercent?: number | null;
  occlusionSuspected?: boolean;
};

export type CarotidStenosisResult = {
  grade: CarotidStenosisGrade;
  label: string;
  percentRange: string;
  criteria: string[];
  strokeRiskNote: string;
  hemodynamicallySignificant: boolean;
};

export function gradeCarotidStenosis(input: CarotidStenosisInput): CarotidStenosisResult {
  if (input.occlusionSuspected) {
    return {
      grade: "occlusion",
      label: "Окклюзия ВСА",
      percentRange: "100%",
      criteria: ["Отсутствие/antegrade потока в дистальной ВСА или типичная окклюзионная картина"],
      strokeRiskNote: "Высокий риск инсульта в бассейне поражённой ВСА; оценка коллатералей обязательна.",
      hemodynamicallySignificant: true,
    };
  }

  const psv = input.psvIcaCmS ?? null;
  const edv = input.edvIcaCmS ?? null;
  const psvCca = input.psvCcaCmS ?? null;
  const ratio = psv != null && psvCca != null && psvCca > 0 ? psv / psvCca : null;
  const morph = input.morphologicPercent ?? null;

  const criteria: string[] = [];
  let grade: CarotidStenosisGrade = "normal";

  if (psv != null) {
    if (psv >= 230) {
      grade = "severe";
      criteria.push(`PSV ВСА ${psv} см/с ≥ 230 см/с (табл. 4.1)`);
    } else if (psv >= EXTRACRANIAL_ARTERIAL_NORMS.icaPsvNormalMaxCmS) {
      grade = "moderate";
      criteria.push(`PSV ВСА ${psv} см/с: 125–229 см/с`);
    } else if (psv >= 100) {
      grade = "mild";
      criteria.push(`PSV ВСА ${psv} см/с: пограничное повышение`);
    }
  }

  if (edv != null && edv >= 100 && grade !== "severe") {
    grade = "severe";
    criteria.push(`EDV ВСА ${edv} см/с ≥ 100 см/с`);
  }

  if (ratio != null) {
    if (ratio >= 4 && grade !== "severe") {
      grade = "severe";
      criteria.push(`ICA/CCA PSV ratio ${ratio.toFixed(1)} ≥ 4.0`);
    } else if (ratio >= 2 && (grade === "normal" || grade === "mild")) {
      grade = "moderate";
      criteria.push(`ICA/CCA PSV ratio ${ratio.toFixed(1)} ≥ 2.0`);
    }
  }

  if (morph != null) {
    if (morph >= 70) grade = "severe";
    else if (morph >= 50 && grade !== "severe") grade = "moderate";
    else if (morph < 50 && grade === "normal") grade = "mild";
    criteria.push(`Морфологическая оценка ~${morph}% (NASCET)`);
  }

  const labels: Record<CarotidStenosisGrade, { label: string; range: string; risk: string; sig: boolean }> = {
    normal: {
      label: "Без гемодинамически значимого стеноза",
      range: "<50%",
      risk: "Низкий риск по данным допплера при типичной картине.",
      sig: false,
    },
    mild: {
      label: "Лёгкое поражение / пограничные скорости",
      range: "<50%",
      risk: "Контроль факторов риска; повторное исследование по клинике.",
      sig: false,
    },
    moderate: {
      label: "Умеренный стеноз",
      range: "50–69%",
      risk: "Умеренный риск инсульта; решение о коррекции — невролог/сосудистый хирург.",
      sig: true,
    },
    severe: {
      label: "Выраженный стеноз",
      range: "70–99%",
      risk: "Высокий риск инсульта; консультация сосудистого хирурга/интервенциониста.",
      sig: true,
    },
    occlusion: {
      label: "Окклюзия",
      range: "100%",
      risk: "Высокий риск; оценка коллатералей и противоположной стороны.",
      sig: true,
    },
  };

  const meta = labels[grade];
  if (!criteria.length) criteria.push("Недостаточно допплер-данных — укажите PSV/EDV ВСА и PSV ОСА.");

  return {
    grade,
    label: meta.label,
    percentRange: meta.range,
    criteria,
    strokeRiskNote: meta.risk,
    hemodynamicallySignificant: meta.sig,
  };
}
