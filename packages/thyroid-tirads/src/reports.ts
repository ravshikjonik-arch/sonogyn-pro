import type { TiradsRuInput, TiradsRuResult } from "./types";
import { formatMm } from "@repo/medical-calculations";
import { DESCRIPTOR_LABELS } from "./constants";

export function buildClinicalProtocolText(input: {
  noduleLocation?: string;
  tiradsInput: TiradsRuInput;
  result: TiradsRuResult;
  bethesda?: string;
}): string {
  const i = input.tiradsInput;
  const r = input.result;
  const lines = [
    "УЗИ щитовидной железы · TI-RADS (адаптация РФ, Катрич и др., 2023)",
    input.noduleLocation ? `Локализация узла: ${input.noduleLocation}` : null,
    "",
    "Описание узла:",
    `  Композиция: ${DESCRIPTOR_LABELS.composition[i.composition]}`,
    `  Эхогенность: ${DESCRIPTOR_LABELS.echogenicity[i.echogenicity]}`,
    `  Форма: ${DESCRIPTOR_LABELS.shape[i.shape]}`,
    `  Контур: ${DESCRIPTOR_LABELS.margin[i.margin]}`,
    `  Кальцификаты: ${DESCRIPTOR_LABELS.calcification[i.calcification]}`,
    i.vascularization
      ? `  Васкуляризация: ${DESCRIPTOR_LABELS.vascularization[i.vascularization]}`
      : null,
    i.largestDiameterMm !== undefined ? `  Наибольший размер: ${formatMm(i.largestDiameterMm)}` : null,
    i.highRiskPatient ? "  Группа повышенного риска: да" : null,
    i.suspiciousLymphNodes ? "  Подозрительные регионарные ЛУ: да" : null,
    "",
    `Категория: ${r.categoryLabel}`,
    `Ориентир риска злокачественности: ${r.malignancyRiskPercent}`,
    "",
    "ЗАКЛЮЧЕНИЕ:",
    `${r.categoryLabel}. ${r.fnaRationale}`,
    input.bethesda ? `Цитология (Bethesda): ${input.bethesda}.` : null,
    "",
    "Тактика:",
    r.followUp,
    r.tiMdsHint ?? null,
    "",
    "Интерпретация и тактика определяются лечащим врачом. Не является самостоятельным диагнозом.",
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

export function buildPatientSheetText(input: {
  result: TiradsRuResult;
  largestDiameterMm?: number;
}): string {
  const lines = [
    "Результаты УЗИ щитовидной железы",
    "",
    `Категория по шкале TI-RADS: ${input.result.category}`,
    `Что это значит: ${input.result.categoryLabel}`,
    input.largestDiameterMm !== undefined
      ? `Размер узла: ${formatMm(input.largestDiameterMm)}`
      : null,
    "",
    input.result.fnaRecommended
      ? "По результатам осмотра может быть рекомендована тонкоигольная биопсия (ТАБ) для уточнения. Решение принимает ваш врач."
      : "На данном этапе обычно достаточно динамического наблюдения по графику, который назначит врач.",
    "",
    input.result.followUp,
    "",
    "Материал носит информационный характер и не заменяет консультацию специалиста.",
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

export function buildProtocolOneLiner(result: TiradsRuResult, sizeMm?: number): string {
  const size = sizeMm !== undefined ? `, ${formatMm(sizeMm)}` : "";
  const fna = result.fnaRecommended ? "ТАБ показана/рассматривается" : "ТАБ не требуется по порогам";
  return `ЩЖ · ${result.categoryLabel}${size}. ${fna}.`;
}
