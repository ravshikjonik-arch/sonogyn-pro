import type { OradsInput, OradsProFinalCategory, OradsResult } from "./types";
import { calcOvaryEllipsoidVolumeMl, formatDimensionsMmRu, formatMeasurementRu } from "@repo/medical-calculations";

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

const riskTextByCategory: Record<OradsProFinalCategory, string> = {
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
      status: blocked ? "reclassify" : "needs_data",
      category: null,
      missing: grid.missing,
      riskText: blocked ? "Требуется переклассификация" : "Нужны данные для расчёта",
      patternLabel,
      recommendation: grid.management,
      rationale: grid.rationale,
      volumeMl,
      structureReclassified: extras?.structureReclassified || undefined,
      warning: warnings.length ? warnings.join(" ") : undefined,
    };
  }

  const warnings = [
    extras?.structureReclassified ? reclassNote : undefined,
    patientWarning,
    grid.warning,
    extras?.extraovarianNote,
  ].filter(Boolean);

  if (grid.category === 0) {
    return {
      status: "technically_incomplete",
      category: 0,
      missing: [],
      riskText: "Технически неполное исследование",
      patternLabel,
      recommendation: grid.management,
      rationale: grid.rationale,
      volumeMl,
      structureReclassified: extras?.structureReclassified || undefined,
      warning: warnings.length ? warnings.join(" ") : undefined,
    };
  }

  return {
    status: "final",
    category: grid.category,
    missing: [],
    riskText: riskTextByCategory[grid.category],
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

const DIMENSION_NAMES_RU = [
  ["lengthMm", "длина"],
  ["widthMm", "ширина"],
  ["heightMm", "высота"],
] as const;

/** Engine asks for the max diameter; the three-dimension rule below replaces that request. */
const ENGINE_SIZE_REQUEST = /размер/i;

function missingDimensionsRu(input: OradsInput): string[] {
  return DIMENSION_NAMES_RU.filter(([key]) => {
    const v = input[key];
    return !(typeof v === "number" && Number.isFinite(v) && v > 0);
  }).map(([, name]) => name);
}

/**
 * Product rule (SonoGyn Pro): every O-RADS calculation needs all three dimensions
 * (length × width × height, mm, 0.1 mm); without them no category is shown.
 */
export function calculateORADS(input: OradsInput): OradsResult {
  const result = calculateOradsFromFeatures(input);
  const absent = missingDimensionsRu(input);
  if (absent.length === 0) return result;

  const sizeRequest = `Укажите три размера образования (длина × ширина × высота, мм) — нет: ${absent.join(", ")}`;
  const otherMissing = result.missing.filter((m) => !ENGINE_SIZE_REQUEST.test(m));
  return {
    ...result,
    status: result.status === "reclassify" ? "reclassify" : "needs_data",
    category: null,
    missing: [sizeRequest, ...otherMissing],
    riskText: result.status === "reclassify" ? result.riskText : "Нужны данные для расчёта",
    patternLabel: result.status === "final" ? undefined : result.patternLabel,
    recommendation: "Категория будет рассчитана после ввода трёх размеров и остальных признаков.",
    rationale: result.status === "final" ? "Без трёх размеров категория O-RADS не выставляется." : result.rationale,
  };
}

function calculateOradsFromFeatures(input: OradsInput): OradsResult {
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
        rationale += ` Объём ${formatMeasurementRu(volumeMl)} мл (>10 мл) — поликистозная морфология по объёму.`;
      }
      if (norm.menopause === "post" && volumeMl > 5) {
        rationale += ` Объём ${formatMeasurementRu(volumeMl)} мл (>5 мл) в постменопаузе — проверьте менопаузальный статус.`;
      }
    }
    return {
      status: "final",
      category: 1,
      missing: [],
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
      status: "final",
      category: 1,
      missing: [],
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
    status: "needs_data",
    category: null,
    missing: ["Уточните тип образования и его морфологию"],
    riskText: "Нужны данные для расчёта",
    patternLabel: derivePatternLabel(norm),
    recommendation: "Уточните морфологию и размер образования для расчёта по O-RADS US v2022.",
    rationale: "Недостаточно структурированных признаков для автоматической категории.",
    volumeMl,
    warning: buildPatientWarnings(norm),
  };
}

/** Results saved before `status` existed (history, cases) carry only a 1–5 category and stay final. */
export function isOradsFinal(
  result: OradsResult,
): result is OradsResult & { status: "final"; category: OradsProFinalCategory } {
  const status = (result as Partial<OradsResult>).status;
  return (
    (status === "final" || status === undefined) &&
    typeof result.category === "number" &&
    result.category >= 1 &&
    result.category <= 5
  );
}

/** Engine category 1–5, or null when the engine did not assign one. */
export function oradsFinalCategory(result: OradsResult): OradsProFinalCategory | null {
  return isOradsFinal(result) ? result.category : null;
}

/** Heading for screens and reports; never shows a number the engine did not assign. */
export function oradsCategoryLabel(result: OradsResult): string {
  if (isOradsFinal(result)) return `O-RADS ${result.category}`;
  if (result.status === "technically_incomplete") return "O-RADS 0";
  return "O-RADS: категория не определена";
}

function missingOf(result: OradsResult): string[] {
  return (result as Partial<OradsResult>).missing ?? [];
}

function missingLine(result: OradsResult): string {
  const missing = missingOf(result);
  return missing.length ? ` Не хватает: ${missing.join("; ")}.` : "";
}

export function buildProtocolOneLiner(result: OradsResult): string {
  const pattern = result.patternLabel ? `${result.patternLabel}. ` : "";
  return `${oradsCategoryLabel(result)}. ${pattern}${result.riskText}.${missingLine(result)} ${result.recommendation}`;
}

export function buildReportText(input: OradsInput, result: OradsResult): string {
  const absent = missingDimensionsRu(input);
  const dims =
    formatDimensionsMmRu(input.lengthMm, input.widthMm, input.heightMm) ??
    (absent.length === 3 ? "не указаны" : `не указаны полностью (нет: ${absent.join(", ")})`);

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
    `${oradsCategoryLabel(result)} (${result.riskText})`,
    missingOf(result).length ? `Не хватает данных: ${missingOf(result).join("; ")}` : null,
    result.patternLabel ? `Паттерн: ${result.patternLabel}` : null,
    `Пациентка: ${ageLine}, ${menopauseLine}${input.menopause === "pre" ? `, ${cycleLine}` : ""}`,
    `Локализация: ${input.localization === "extraovarian" ? "Экстраовариальная" : "Овариальная/аднексальная"}`,
    `Размеры: ${dims}`,
    `Объем: ${result.volumeMl == null ? "не рассчитан" : `${formatMeasurementRu(result.volumeMl)} мл`}`,
    `Асцит: ${input.ascites ? "да" : "нет"}`,
    `Кровоток: ${input.bloodFlow ?? "не указан"}`,
    `Обоснование: ${result.rationale}`,
    `Рекомендации: ${result.recommendation}`,
  ]
    .filter(Boolean)
    .join("\n");
}
