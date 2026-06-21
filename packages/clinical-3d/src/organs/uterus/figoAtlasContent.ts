/**
 * FIGO leiomyoma subclassification — контент SonoGyn Pro (PALM-COEIN · L).
 * Munro et al., FIGO 2011/2018; transmural subtypes по VIR / interventional radiology atlas.
 */

import type { FigoType } from "../../types";

/** Расширенные коды для трансмуральных подтипов (образовательный слой). */
export type FigoVariantCode = "2-5" | "3-5";

export type FigoDisplayCode = FigoType | FigoVariantCode;

export type FigoAtlasEntry = {
  code: FigoDisplayCode;
  /** Базовый FIGO для протокола (0–8). */
  primaryType: number;
  title: string;
  localization: string;
  /** Краткая строка для протокола. */
  summaryRu: string;
  /** Блок «Описание для SonoGyn-Pro». */
  sonoGynBullets: string[];
  /** Путь к атласному снимку (SVG, без подписей). */
  atlasImageSrc: string;
  /** Образовательная группа. */
  bucket: "submucosal" | "intramural" | "subserosal" | "other" | "transmural";
};

const BASE = "/atlas/figo-us";

export const FIGO_ATLAS_ENTRIES: FigoAtlasEntry[] = [
  {
    code: "0",
    primaryType: 0,
    title: "FIGO 0",
    localization: "Субмукозная миома полностью в полости матки на ножке",
    summaryRu: "Субмукозная на ножке, полностью в полости, без интрамурального компонента",
    sonoGynBullets: [
      "Узел полностью в полости матки",
      "Тонкая ножка",
      "Нет интрамурального компонента",
    ],
    atlasImageSrc: `${BASE}/figo-0.svg`,
    bucket: "submucosal",
  },
  {
    code: "1",
    primaryType: 1,
    title: "FIGO 1",
    localization: "Субмукозная, <50% объёма в миометрии",
    summaryRu: "Субмукозная, менее половины объёма интрамурально",
    sonoGynBullets: [
      "Большая часть узла выступает в полость",
      "Менее 50% находится в миометрии",
    ],
    atlasImageSrc: `${BASE}/figo-1.svg`,
    bucket: "submucosal",
  },
  {
    code: "2",
    primaryType: 2,
    title: "FIGO 2",
    localization: "Субмукозная, ≥50% объёма в миометрии",
    summaryRu: "Субмукозная, не менее половины объёма интрамурально",
    sonoGynBullets: [
      "Более 50% узла погружено в миометрий",
      "Деформирует эндометрий",
    ],
    atlasImageSrc: `${BASE}/figo-2.svg`,
    bucket: "submucosal",
  },
  {
    code: "3",
    primaryType: 3,
    title: "FIGO 3",
    localization: "Полностью интрамуральная, касается эндометрия",
    summaryRu: "Интрамуральная с контактом эндометрия, без выступания в полость",
    sonoGynBullets: [
      "Полностью в миометрии",
      "Контактирует с эндометрием",
      "Не выступает в полость",
    ],
    atlasImageSrc: `${BASE}/figo-3.svg`,
    bucket: "intramural",
  },
  {
    code: "4",
    primaryType: 4,
    title: "FIGO 4",
    localization: "Полностью интрамуральная",
    summaryRu: "Интрамуральная без контакта с эндометрием и серозой",
    sonoGynBullets: [
      "Полностью окружена миометрием",
      "Нет контакта с эндометрием и серозой",
    ],
    atlasImageSrc: `${BASE}/figo-4.svg`,
    bucket: "intramural",
  },
  {
    code: "5",
    primaryType: 5,
    title: "FIGO 5",
    localization: "Субсерозная, ≥50% объёма в миометрии",
    summaryRu: "Субсерозная, не менее половины объёма интрамурально",
    sonoGynBullets: [
      "Подходит к серозе",
      "Более 50% объёма остаётся интрамуральным",
    ],
    atlasImageSrc: `${BASE}/figo-5.svg`,
    bucket: "subserosal",
  },
  {
    code: "6",
    primaryType: 6,
    title: "FIGO 6",
    localization: "Субсерозная, <50% объёма в миометрии",
    summaryRu: "Субсерозная, менее половины объёма интрамурально",
    sonoGynBullets: [
      "Преимущественно выступает наружу",
      "Менее 50% объёма остаётся в миометрии",
    ],
    atlasImageSrc: `${BASE}/figo-6.svg`,
    bucket: "subserosal",
  },
  {
    code: "7",
    primaryType: 7,
    title: "FIGO 7",
    localization: "Субсерозная миома на ножке",
    summaryRu: "Субсерозная на ножке",
    sonoGynBullets: ["Субсерозная миома на ножке"],
    atlasImageSrc: `${BASE}/figo-7.svg`,
    bucket: "subserosal",
  },
  {
    code: "8",
    primaryType: 8,
    title: "FIGO 8",
    localization: "Шеечная, паразитарная, в широкой связке и другие необычные локализации",
    summaryRu: "Иная локализация (шейка, широкая связка, паразитарная)",
    sonoGynBullets: [
      "Шейка матки",
      "Широкая связка",
      "Паразитарная миома",
      "Иные внестеночные локализации",
    ],
    atlasImageSrc: `${BASE}/figo-8.svg`,
    bucket: "other",
  },
  {
    code: "2-5",
    primaryType: 2,
    title: "FIGO 2–5",
    localization: "Трансмуральная миома от эндометрия до серозы",
    summaryRu: "Трансмуральная: от эндометрия до серозы (субмукозный компонент + полная толщина стенки)",
    sonoGynBullets: [
      "Узел пересекает всю толщину миометрия",
      "Контакт с эндометрием и серозой",
      "Субмукозный компонент существенный — уточните FIGO 2 vs 5 на срезе",
    ],
    atlasImageSrc: `${BASE}/figo-2-5.svg`,
    bucket: "transmural",
  },
  {
    code: "3-5",
    primaryType: 4,
    title: "FIGO 3–5",
    localization: "Интрамуральная миома, контактирующая одновременно с эндометрием и серозой",
    summaryRu: "Интрамуральная трансмуральная: контакт эндометрия + сероза без доминирующего субмукозного/субсерозного выступания",
    sonoGynBullets: [
      "Полностью в миометрии",
      "Одновременный контакт с эндометрием и серозой",
      "Без выраженного выступания в полость или наружу",
    ],
    atlasImageSrc: `${BASE}/figo-3-5.svg`,
    bucket: "transmural",
  },
];

const ENTRY_BY_CODE = new Map<FigoDisplayCode, FigoAtlasEntry>(
  FIGO_ATLAS_ENTRIES.map((e) => [e.code, e]),
);

export function getFigoAtlasEntry(code: FigoDisplayCode | number | string): FigoAtlasEntry | null {
  const key = String(code) as FigoDisplayCode;
  return ENTRY_BY_CODE.get(key) ?? null;
}

export function getFigoAtlasEntryForType(
  primaryType: number,
  variant?: FigoVariantCode | null,
): FigoAtlasEntry {
  if (variant) {
    const v = getFigoAtlasEntry(variant);
    if (v) return v;
  }
  const base = getFigoAtlasEntry(String(primaryType) as FigoType);
  if (base) return base;
  return FIGO_ATLAS_ENTRIES[4]!;
}

export function formatFigoSonoGynBlock(entry: FigoAtlasEntry): string {
  const lines = [
    `${entry.title} — ${entry.localization}`,
    ...entry.sonoGynBullets.map((b) => `• ${b}`),
  ];
  return lines.join("\n");
}

export function formatFigoProtocolLine(
  primaryType: number,
  variant: FigoVariantCode | null | undefined,
  localizationRu?: string,
  sizeLine?: string,
): string {
  const entry = getFigoAtlasEntryForType(primaryType, variant ?? null);
  const loc = localizationRu ? `, ${localizationRu}` : "";
  const size = sizeLine ? `, ${sizeLine}` : "";
  const variantNote = variant ? ` (подтип ${variant})` : "";
  return `Миома матки — ${entry.title}${variantNote}: ${entry.summaryRu}${loc}${size}.`;
}

/** Обновлённые краткие описания для FIGO_TYPES (legacy API). */
export const FIGO_SHORT_DESCRIPTIONS: Record<FigoType, string> = {
  "0": FIGO_ATLAS_ENTRIES[0]!.summaryRu,
  "1": FIGO_ATLAS_ENTRIES[1]!.summaryRu,
  "2": FIGO_ATLAS_ENTRIES[2]!.summaryRu,
  "3": FIGO_ATLAS_ENTRIES[3]!.summaryRu,
  "4": FIGO_ATLAS_ENTRIES[4]!.summaryRu,
  "5": FIGO_ATLAS_ENTRIES[5]!.summaryRu,
  "6": FIGO_ATLAS_ENTRIES[6]!.summaryRu,
  "7": FIGO_ATLAS_ENTRIES[7]!.summaryRu,
  "8": FIGO_ATLAS_ENTRIES[8]!.summaryRu,
};
