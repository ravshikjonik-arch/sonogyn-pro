import path from "path";
import fs from "fs";

import {
  BiradsCategory,
  BiradsCriteria,
  DopplerReference,
  ElastographyReference,
  SimplifiedTriagingRule,
  VascularityPattern,
  TsukubaTypeScore,
} from "./types.ts";

// --- Data Loaders (Placeholder - in a real app, these would be loaded asynchronously or from a bundle) ---
// JSON files will be copied to the dist folder by tsup, relative to the output root.
// When bundled, __dirname will be the dist folder.
const BIRADS_CRITERIA_PATH = path.resolve(__dirname, "../../02-classifications/data/birads-criteria.json");
const DOPPLER_REFERENCE_PATH = path.resolve(__dirname, "../../03-angiography-doppler/data/doppler-reference.json");
const ELASTOGRAPHY_REFERENCE_PATH = path.resolve(__dirname, "../../04-elastography/data/elastography-reference.json");

const biradsCriteriaData = JSON.parse(fs.readFileSync(BIRADS_CRITERIA_PATH, "utf8"));
const dopplerReferenceData = JSON.parse(fs.readFileSync(DOPPLER_REFERENCE_PATH, "utf8"));
const elastographyReferenceData = JSON.parse(fs.readFileSync(ELASTOGRAPHY_REFERENCE_PATH, "utf8"));

const biradsCriteria: BiradsCriteria = biradsCriteriaData;
const dopplerReference: DopplerReference = dopplerReferenceData;
const elastographyReference: ElastographyReference = elastographyReferenceData;

// --- i18n (Placeholder - assuming a simple key-value store for now) ---
// In a real application, this would integrate with an existing i18n framework
const i18n = {
  en: {},
  ru: {
    biradsCategory0: "Требуется доп. визуализация",
    biradsCategory1: "Норма",
    biradsCategory2: "Доброкачественная находка",
    biradsCategory3: "Вероятно доброкачественная",
    biradsCategory4a: "Подозрительная (низкая)",
    biradsCategory4b: "Подозрительная (средняя)",
    biradsCategory4c: "Подозрительная (высокая)",
    biradsCategory5: "Высоко подозрительна",
    biradsCategory6: "Верифицированная злокачественность",
    biradsDisclaimer: "Упрощённые правила предназначены только для UI-подсказок мастера ввода. Финальную категорию определяет врач.",
    vascularityAvascular: "Аваскулярное",
    vascularityPeripheral: "Периферическая",
    vascularityCentralMixed: "Центральная/смешанная",
    vascularityChaotic: "Хаотичная, дезорганизованная",
    vascularityPenetrating: "Пенетрирующие сосуды",
    elastographyQualitativeScore: "Качественная оценка (по Tsukuba)",
    elastographyQuantitativeMps: "Количественная оценка (м/с)",
    elastographyQuantitativeKpa: "Количественная оценка (кПа)",
    suspicionLow: "Низкая",
    suspicionMedium: "Средняя",
    suspicionHigh: "Высокая",
    suspicionIndeterminate: "Неопределенная",
    suspicionBenign: "Доброкачественная",
    suspicionSuspicious: "Подозрительная",
    suspicionHighlySuspicious: "Высоко подозрительная",
    elastographyDisclaimer: "Числовые пороги зависят от производителя сканера и протокола калибровки. Приведенные значения являются ориентировочными.",
    // ... add more keys as needed for other labels/descriptions
  },
};

/**
 * Предлагает предварительную BI-RADS категорию на основе предоставленных дескрипторов.
 * Важно: это упрощенное правило для UI-подсказок, не финальный диагностический критерий.
 * @param descriptors Объект с дескрипторами образования (например, { shape: "oval", margin: "circumscribed" }).
 * @returns Предварительная BI-RADS категория или null, если не найдено подходящее правило.
 */
export function suggestBiradsCategory(descriptors: { [key: string]: string | string[] }): {
  category: string;
  disclaimer: string;
} | null {
  const rules = biradsCriteria.simplifiedTriagingRules;
  for (const rule of rules) {
    if (rule.if) {
      let matchesAll = true;
      for (const key in rule.if) {
        const ruleValue = rule.if[key];
        const descriptorValue = descriptors[key];

        if (!descriptorValue) {
          matchesAll = false;
          break;
        }

        if (Array.isArray(ruleValue)) {
          if (!ruleValue.includes(descriptorValue as string)) {
            matchesAll = false;
            break;
          }
        } else {
          if (ruleValue !== descriptorValue) {
            matchesAll = false;
            break;
          }
        }
      }
      if (matchesAll) {
        return {
          category: rule.suggestedCategory,
          disclaimer: i18n.ru.biradsDisclaimer, // Используем локализованный дисклеймер
        };
      }
    }
    if (rule.ifAny) {
      let matchesAny = false;
      for (const key in rule.ifAny) {
        const ruleValue = rule.ifAny[key];
        const descriptorValue = descriptors[key];

        if (descriptorValue) {
          if (Array.isArray(ruleValue)) {
            if (ruleValue.includes(descriptorValue as string)) {
              matchesAny = true;
              break;
            }
          } else {
            if (ruleValue === descriptorValue) {
              matchesAny = true;
              break;
            }
          }
        }
      }
      if (matchesAny) {
        return {
          category: rule.suggestedCategory,
          disclaimer: i18n.ru.biradsDisclaimer,
        };
      }
    }
  }
  return null;
}

/**
 * Оценивает паттерн васкуляризации и возвращает текстовый вывод и уровень подозрительности.
 * @param patternId Идентификатор паттерна васкуляризации (например, "avascular", "chaotic").
 * @returns Объект с текстовым описанием и уровнем подозрительности (low/medium/high).
 */
export function evaluateVascularityPattern(patternId: string): {
  text: string;
  suspicion: "low" | "medium" | "high" | "indeterminate";
} {
  const pattern = dopplerReference.vascularityPatterns.find((p) => p.id === patternId);
  if (!pattern) {
    return { text: `Неизвестный паттерн васкуляризации: ${patternId}`, suspicion: "indeterminate" };
  }

  let suspicion: "low" | "medium" | "high" | "indeterminate" = "indeterminate";
  switch (patternId) {
    case "avascular":
      suspicion = "low";
      break;
    case "peripheral":
      suspicion = "medium"; // Может быть доброкачественным, но не исключает подозрительные
      break;
    case "central_or_mixed":
      suspicion = "high";
      break;
    case "chaotic":
      suspicion = "high";
      break;
    case "penetrating":
      suspicion = "high";
      break;
  }

  return {
    text: i18n.ru[`vascularity${patternId.charAt(0).toUpperCase() + patternId.slice(1)}` as keyof typeof i18n.ru] || pattern.labelRu,
    suspicion,
  };
}

interface ElastographyThresholds {
  strainRatio?: {
    benignUpper: number;
    suspiciousLower: number;
  };
  kpa?: {
    benignUpper: number;
    suspiciousLower: number;
  };
  mps?: {
    benignUpper: number;
    suspiciousLower: number;
  };
}

/**
 * Оценивает эластографический показатель (Strain Ratio, kPa, m/s) и возвращает текстовый вывод и уровень подозрительности.
 * Числовые пороги зависят от производителя сканера и протокола калибровки.
 * @param modalityId Идентификатор модальности эластографии (strain_elastography, shear_wave_2d, arfi).
 * @param value Числовое значение показателя (Strain Ratio, kPa, m/s).
 * @param customThresholds Кастомные (зависящие от аппарата) пороги. Если не указаны, используются внутренние ориентировочные.
 * @returns Объект с текстовым описанием, уровнем подозрительности (low/medium/high) и дисклеймером.
 */
export function evaluateElastographyScore(
  modalityId: string,
  value: number,
  customThresholds?: ElastographyThresholds
): {
  text: string;
  suspicion: "low" | "medium" | "high" | "indeterminate";
  disclaimer: string;
} {
  const disclaimer = i18n.ru.elastographyDisclaimer;
  let suspicion: "low" | "medium" | "high" | "indeterminate" = "indeterminate";
  let text = "";

  // TODO: Implement more nuanced interpretation for ARFI which can be qualitative/semi-quantitative

  switch (modalityId) {
    case "strain_elastography": {
      const thresholds = customThresholds?.strainRatio || { benignUpper: 2.5, suspiciousLower: 4.0 }; // Ориентировочные пороги
      text = `Strain Ratio: ${value.toFixed(2)}. `;
      if (value <= thresholds.benignUpper) {
        suspicion = "low";
        text += "Соответствует доброкачественному образованию.";
      } else if (value >= thresholds.suspiciousLower) {
        suspicion = "high";
        text += "Высоко подозрительно в отношении злокачественности.";
      } else {
        suspicion = "medium";
        text += "Подозрительно, требует дополнительной оценки.";
      }
      break;
    }
    case "shear_wave_2d": {
      // SWE can be in m/s or kPa
      const kpaThresholds = customThresholds?.kpa || { benignUpper: 25, suspiciousLower: 50 }; // Ориентировочные пороги
      const mpsThresholds = customThresholds?.mps || { benignUpper: 3.5, suspiciousLower: 5.0 }; // Ориентировочные пороги (для reference)

      text = `Эластичность (kPa): ${value.toFixed(2)}. `;
      if (value <= kpaThresholds.benignUpper) {
        suspicion = "low";
        text += "Соответствует доброкачественному образованию.";
      } else if (value >= kpaThresholds.suspiciousLower) {
        suspicion = "high";
        text += "Высоко подозрительно в отношении злокачественности.";
      } else {
        suspicion = "medium";
        text += "Подозрительно, требует дополнительной оценки.";
      }
      // TODO: Add logic for m/s if input value is in m/s and differentiate in UI/API
      break;
    }
    case "arfi": {
      // ARFI is often qualitative or semi-quantitative, more complex to define simple thresholds
      text = "ARFI: Для ARFI требуется качественная оценка. ";
      suspicion = "indeterminate"; // Default to indeterminate
      // TODO: Add rules for ARFI based on qualitative assessment (e.g., visual stiffness score)
      break;
    }
    default:
      text = `Неизвестная модальность эластографии: ${modalityId}.`;
      suspicion = "indeterminate";
  }

  return { text, suspicion, disclaimer };
}

// --- Localization functions for BiradsCategory (Example) ---
export function getBiradsCategoryLabel(code: string): string {
    const category = biradsCriteria.categories.find(cat => cat.code === code);
    return category ? category.labelRu : `Категория ${code}`;
}

export function getBiradsCategoryRecommendation(code: string): string {
    const category = biradsCriteria.categories.find(cat => cat.code === code);
    return category ? category.recommendationRu : "Нет рекомендации";
}

// TODO: Implement load data logic that mirrors ADNEX/O-RADS/TI-RADS (e.g., a service to load all JSONs)
// TODO: Implement i18n infrastructure for other languages (en/es/fr/ar) for labelRu/descriptionRu fields
