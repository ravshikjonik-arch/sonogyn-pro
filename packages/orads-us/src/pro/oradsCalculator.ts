import type { OradsInput, OradsResult } from "./types";
import { calcOvaryEllipsoidVolumeMl, formatMeasurementDecimal } from "@repo/medical-calculations";

import { evaluateOradsUs2022 } from "../us2022/evaluateOradsUs2022";
import { mapProInputToUs2022 } from "../us2022/mapProInputToUs2022";
import type { OradsUs2022Result } from "../us2022/types";

function toCm(mm?: number): number | null {
  if (typeof mm !== "number" || !Number.isFinite(mm) || mm <= 0) return null;
  return mm / 10;
}

function calcVolumeMl(lengthMm?: number, widthMm?: number, heightMm?: number): number | null {
  return calcOvaryEllipsoidVolumeMl(lengthMm, widthMm, heightMm);
}

const riskTextByCategory: Record<OradsResult["category"], string> = {
  1: "Норма / физиология",
  2: "Риск ЗНО <1%",
  3: "Риск ЗНО 1–10%",
  4: "Риск ЗНО 10–50%",
  5: "Риск ЗНО ≥50%",
};

function us2022ResultToPro(
  _input: OradsInput,
  norm: OradsInput,
  grid: OradsUs2022Result,
  volumeMl: number | null,
  extras?: { extraovarianNote?: string; structureReclassified?: boolean },
): OradsResult {
  const reclassNote =
    "O-RADS US v2022: неполная перегородка во 2-й плоскости — пересчёт как однокамерное.";
  const patientWarning = buildPatientWarnings(norm);
  const patternLabel = derivePatternLabel(norm);

  if (grid.category === null) {
    const blocked = Boolean(grid.warning);
    const warnings = [
      extras?.structureReclassified ? reclassNote : undefined,
      patientWarning,
      grid.warning,
      grid.missing.length ? `Не хватает данных: ${grid.missing.join("; ")}` : undefined,
      extras?.extraovarianNote,
    ].filter(Boolean);
    return {
      category: blocked ? 4 : 3,
      riskText: blocked ? "Требуется переклассификация" : "Нужны данные для расчёта",
      patternLabel,
      recommendation: grid.management,
      rationale: grid.rationale,
      volumeMl,
      structureReclassified: extras?.structureReclassified || undefined,
      warning: warnings.length ? warnings.join(" ") : undefined,
    };
  }

  const category = grid.category === 0 ? 3 : grid.category;
  const riskText =
    grid.category === 0 ? "O-RADS 0 (технически неполно)" : grid.risk.replace("< 1%", "<1%") || riskTextByCategory[category];

  const warnings = [
    extras?.structureReclassified ? reclassNote : undefined,
    patientWarning,
    grid.warning,
    extras?.extraovarianNote,
  ].filter(Boolean);

  return {
    category,
    riskText: category in riskTextByCategory ? riskTextByCategory[category as OradsResult["category"]] : riskText,
    patternLabel,
    recommendation: grid.management,
    rationale: extras?.structureReclassified ? `${reclassNote} ${grid.rationale}` : grid.rationale,
    volumeMl,
    structureReclassified: extras?.structureReclassified || undefined,
    warning: warnings.length ? warnings.join(" ") : undefined,
  };
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
    const gridInput = mapProInputToUs2022(norm);
    if (gridInput) {
      const grid = evaluateOradsUs2022(gridInput);
      return us2022ResultToPro(input, norm, grid, volumeMl, {
        extraovarianNote:
          "Экстраовариальная локализация — проверьте типичный classic benign vs atypical по O-RADS US v2022.",
      });
    }
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

  if (norm.lesionKind === "nonphysiological") {
    const gridInput = mapProInputToUs2022(norm);
    if (gridInput) {
      const grid = evaluateOradsUs2022(gridInput);
      return us2022ResultToPro(input, norm, grid, volumeMl, { structureReclassified });
    }
  }

  return {
    category: 3,
    riskText: riskTextByCategory[3],
    patternLabel: derivePatternLabel(norm),
    recommendation: "Уточните морфологию и размер образования для расчёта по O-RADS US v2022.",
    rationale: "Недостаточно структурированных признаков для автоматической категории.",
    volumeMl,
    warning: buildPatientWarnings(norm),
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
