import type { BloodFlow, OradsInput, OradsResult } from "../types";
import { calcOvaryEllipsoidVolumeMl, formatMeasurementDecimal } from "@repo/medical-calculations";

function toCm(mm?: number): number | null {
  if (typeof mm !== "number" || !Number.isFinite(mm) || mm <= 0) return null;
  return mm / 10;
}

function calcVolumeMl(lengthMm?: number, widthMm?: number, heightMm?: number): number | null {
  return calcOvaryEllipsoidVolumeMl(lengthMm, widthMm, heightMm);
}

function bloodAtLeast(flow: BloodFlow | undefined, threshold: BloodFlow): boolean {
  const rank: Record<BloodFlow, number> = { none: 0, minimal: 1, moderate: 2, marked: 3 };
  if (!flow) return false;
  return rank[flow] >= rank[threshold];
}

function bumpRisk(category: number): 1 | 2 | 3 | 4 | 5 {
  if (category >= 4) return 4;
  return (category + 1) as 2 | 3 | 4;
}

function buildPatientWarnings(input: OradsInput): string | undefined {
  const notes: string[] = [];
  if (typeof input.ageYears === "number" && input.ageYears >= 50 && input.menopause === "pre") {
    notes.push("Возраст ≥50 лет при статусе «пременопауза» — при сомнении учитывайте как постменопаузу (O-RADS US v2022).");
  }
  if (input.menopause === "post" && typeof input.cycleDay === "number") {
    notes.push("День цикла указан при постменопаузе — проверьте менопаузальный статус.");
  }
  return notes.length ? notes.join(" ") : undefined;
}

function derivePatternLabel(input: OradsInput): string | undefined {
  if (input.menopause !== "pre") return undefined;

  if (input.lesionKind === "physiological") {
    if (input.physiologicalType === "follicle") return "Фолликул";
    if (input.physiologicalType === "corpus_luteum") return "Желтое тело";
  }

  if (input.lesionKind === "normal_ovary") {
    if (input.normalOvaryPattern === "multifollicular") return "Мультифолликулярный рисунок";
    return "Нормальное яичник";
  }

  if (
    input.lesionKind === "nonphysiological" &&
    input.structure === "unilocular" &&
    input.unilocularSubtype === "simple_cyst" &&
    !input.solidComponent &&
    input.bloodFlow !== "moderate" &&
    input.bloodFlow !== "marked"
  ) {
    const day = input.cycleDay;
    if (day == null || (day >= 5 && day <= 28)) {
      return "Вероятна функциональная киста";
    }
  }

  return undefined;
}

/**
 * O-RADS US v2022: неполная перегородка во 2-й плоскости → однокамерное (не многокамерное).
 */
function applyOradsUsStructure(input: OradsInput): { input: OradsInput; structureReclassified: boolean } {
  if (!input.incompleteSeptum || input.structure !== "multilocular" || input.solidComponent) {
    return { input, structureReclassified: false };
  }

  const inferredSubtype =
    input.unilocularSubtype ??
    (input.septaThickness === "thin" || input.septaThickness === undefined ? "simple_cyst" : "other");

  return {
    input: {
      ...input,
      structure: "unilocular",
      unilocularSubtype: inferredSubtype,
    },
    structureReclassified: true,
  };
}

export function calculateORADS(input: OradsInput): OradsResult {
  const { input: norm, structureReclassified } = applyOradsUsStructure(input);
  const maxCm = Math.max(toCm(norm.lengthMm) ?? 0, toCm(norm.widthMm) ?? 0, toCm(norm.heightMm) ?? 0);
  const volumeMl = calcVolumeMl(norm.lengthMm, norm.widthMm, norm.heightMm);

  if (norm.localization === "extraovarian") {
    return {
      category: 2,
      riskText: "Низкий риск",
      recommendation: "Этот калькулятор валиден для яичников/придатков. Нужна отдельная оценка.",
      rationale: "Выбрана экстраовариальная локализация.",
      volumeMl,
      warning: "Калькулятор O-RADS предназначен только для овариальных/аднексальных образований.",
    };
  }

  // O-RADS 1: нормальное / мультифолликулярное яичник без focal образования
  if (norm.lesionKind === "normal_ovary" && norm.menopause) {
    const isMulti = norm.normalOvaryPattern === "multifollicular";
    let rationale = isMulti
      ? "Мультифолликулярный рисунок без focal образования — O-RADS 1 (клиническая корреляция, AFC)."
      : "Нормальное яичник без focal образования — O-RADS 1.";
    if (volumeMl != null) {
      if (norm.menopause === "pre" && volumeMl > 10) {
        rationale += ` Объём ${volumeMl} мл (>10 мл) — поликистозная морфология по объёму.`;
      }
      if (norm.menopause === "post" && volumeMl > 5) {
        rationale += ` Объём ${volumeMl} мл (>5 мл) в постменопаузе — проверьте менопаузальный статус.`;
      }
    }
    return {
      category: 1,
      riskText: "Норма / физиология",
      recommendation: "Рутинное наблюдение; при СПКЯ — клиническая корреляция (AFC, аменорея, андрогены).",
      rationale,
      volumeMl,
      patternLabel: derivePatternLabel(norm),
    };
  }

  // O-RADS 1: физиологическое у пременопаузы <= 3 см
  if (
    norm.menopause === "pre" &&
    norm.lesionKind === "physiological" &&
    (norm.physiologicalType === "follicle" || norm.physiologicalType === "corpus_luteum") &&
    maxCm > 0 &&
    maxCm <= 3
  ) {
    return {
      category: 1,
      riskText: "Физиологическое",
      recommendation: "Рутинное наблюдение по клинической необходимости.",
      rationale: "Пременопауза + физиологическое образование ≤3 см.",
      volumeMl,
    };
  }

  let category: 1 | 2 | 3 | 4 | 5 = 3;
  let rationale = "Промежуточный паттерн, требуется клинико-инструментальная корреляция.";

  if (norm.lesionKind === "nonphysiological") {
    if (norm.structure === "unilocular") {
      if (norm.unilocularSubtype === "simple_cyst") {
        if (norm.menopause === "post" && maxCm > 5) {
          category = 3;
          rationale = "Однокамерная простая киста >5 см в постменопаузе.";
        } else {
          category = 2;
          rationale = "Типичная однокамерная простая киста.";
        }
      } else if (
        norm.unilocularSubtype === "hemorrhagic" ||
        norm.unilocularSubtype === "dermoid" ||
        norm.unilocularSubtype === "endometrioma"
      ) {
        if (norm.solidComponent || bloodAtLeast(norm.bloodFlow, "moderate")) {
          category = 3;
          rationale = "Геморрагическая/дермоидная/эндометриома с атипичными признаками.";
        } else {
          category = 2;
          rationale = "Типичный доброкачественный паттерн (геморрагическая/дермоидная/эндометриома).";
        }
      } else {
        category = 3;
        rationale = "Нетипичный/другой однокамерный паттерн.";
      }
    }

    if (norm.structure === "multilocular") {
      if (!norm.solidComponent && norm.septaThickness === "thin") {
        if (maxCm >= 10) {
          category = 3;
          rationale = "Многокамерная киста без солидного компонента, тонкие перегородки, размер ≥10 см.";
        } else {
          category = 2;
          rationale = "Многокамерная киста без солидного компонента, тонкие перегородки, размер <10 см.";
        }
      } else if (norm.solidComponent && (norm.solidType === "irregular" || bloodAtLeast(norm.bloodFlow, "moderate"))) {
        category = 4;
        rationale = "Многокамерная киста с солидным компонентом и подозрительными признаками.";
      }
    }

    if (norm.structure === "solid") {
      if (norm.solidType === "irregular" && bloodAtLeast(norm.bloodFlow, "marked")) {
        category = 5;
        rationale = "Солидное образование с неровным контуром и выраженным кровотоком.";
      } else {
        category = 4;
        rationale = "Солидное образование с подозрительным паттерном.";
      }
    }

    if (norm.solidType === "papillary" && norm.solidComponent) {
      category = Math.max(category, 4) as 4 | 5;
      rationale = "Папиллярные разрастания ≥3 мм.";
    }
  }

  // Override rules
  if (norm.ascites) {
    category = Math.max(category, 4) as 4 | 5;
    rationale = "Асцит повышает категорию минимум до O-RADS 4.";
  }
  if (norm.peritonealNodules && norm.ascites) {
    category = 5;
    rationale = "Асцит + перитонеальные высыпания при подозрительном компоненте.";
  }
  if (norm.solidComponent && bloodAtLeast(norm.bloodFlow, "minimal")) {
    category = Math.max(category, 3) as 3 | 4 | 5;
  }
  if (norm.menopause === "post" && maxCm > 10) {
    category = bumpRisk(category);
    rationale = `${rationale} Размер >10 см в постменопаузе повышает риск на 1 ступень (до O-RADS 4).`;
  }

  const riskTextByCategory: Record<OradsResult["category"], string> = {
    1: "Норма / физиология",
    2: "Риск ЗНО <1%",
    3: "Риск ЗНО 1–10%",
    4: "Риск ЗНО 10–50%",
    5: "Риск ЗНО ≥50%",
  };

  const recommendationByCategory: Record<OradsResult["category"], string> = {
    1: "Наблюдение не требуется.",
    2: "Наблюдение по размеру и менопаузе.",
    3: "УЗИ-эксперт / МРТ; консультация гинеколога.",
    4: "Онкогинеколог по протоколу центра.",
    5: "Срочно онкогинеколог, стадирование.",
  };

  const reclassNote =
    "O-RADS US v2022: неполная перегородка во 2-й плоскости — пересчёт как однокамерное.";
  const patientWarning = buildPatientWarnings(norm);
  const patternLabel = derivePatternLabel(norm);
  const warnings = [structureReclassified ? reclassNote : undefined, patientWarning].filter(Boolean);

  return {
    category,
    riskText: riskTextByCategory[category],
    patternLabel,
    recommendation: recommendationByCategory[category],
    rationale: structureReclassified ? `${reclassNote} ${rationale}` : rationale,
    volumeMl,
    structureReclassified: structureReclassified || undefined,
    warning: warnings.length ? warnings.join(" ") : undefined,
  };
}

export function buildProtocolOneLiner(result: OradsResult): string {
  const pattern = result.patternLabel ? `${result.patternLabel}. ` : "";
  return `O-RADS ${result.category}. ${pattern}${result.riskText} ${result.recommendation}`;
}

export function buildReportText(input: OradsInput, result: OradsResult): string {
  const dims = [input.lengthMm, input.widthMm, input.heightMm].every((v) => typeof v === "number" && v > 0)
    ? `${formatMeasurementDecimal(input.lengthMm!)}×${formatMeasurementDecimal(input.widthMm!)}×${formatMeasurementDecimal(input.heightMm!)} мм`
    : "не указаны";

  const menopauseLine =
    input.menopause === "pre"
      ? "пременопауза"
      : input.menopause === "post"
        ? "постменопауза"
        : "не указана";
  const ageLine = typeof input.ageYears === "number" && input.ageYears > 0 ? `${input.ageYears} лет` : "не указан";
  const cycleLine =
    input.menopause === "pre" && typeof input.cycleDay === "number" && input.cycleDay > 0
      ? `${input.cycleDay}-й день цикла`
      : "не указан";

  return [
    `O-RADS: ${result.category} (${result.riskText})`,
    result.patternLabel ? `Паттерн: ${result.patternLabel}` : null,
    `Пациентка: ${ageLine}, ${menopauseLine}${input.menopause === "pre" ? `, ${cycleLine}` : ""}`,
    `Локализация: ${input.localization === "extraovarian" ? "Экстраовариальная" : "Овариальная/аднексальная"}`,
    `Размеры: ${dims}`,
    `Объем: ${result.volumeMl == null ? "не рассчитан" : `${result.volumeMl} мл`}`,
    `Асцит: ${input.ascites ? "да" : "нет"}`,
    `Кровоток: ${input.bloodFlow ?? "не указан"}`,
    `Обоснование: ${result.rationale}`,
    `Рекомендации: ${result.recommendation}`,
  ]
    .filter(Boolean)
    .join("\n");
}
