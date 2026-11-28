/**
 * visionChecklists — Vision V1 («чеклист по фото»): структурированные чеклисты
 * признаков лексикона по нозологиям. Врач отмечает наблюдаемое — расчёт категории
 * выполняет ДВИЖОК; ИИ не ставит категорию и не «опознаёт диагноз»
 * (комплаенс-рамка AI_PLATFORM_WIDE_V2.md §3).
 */
import type { KnowledgeCitation } from "./types.js";

export interface VisionChecklistItem {
  id: string;
  label: string;
  hint?: string;
  /** Связь с инструментом: какой слот движка заполняет признак (если применимо). */
  slot?: string;
  slotValue?: string | number | boolean;
}

export interface VisionChecklist {
  nosology: string;
  title: string;
  instruction: string;
  items: VisionChecklistItem[];
  /** Инструмент, который считает категорию из отмеченных признаков. */
  tool?: string;
  citation: KnowledgeCitation;
  note: string;
}

const UTERUS_FIGO_ITEMS: VisionChecklistItem[] = [
  {
    id: "loc",
    label: "Основная локализация узла",
    hint: "подслизистая / интрамуральная / субсерозная / шейка или паразитирующий",
    slot: "primaryLocation",
  },
  {
    id: "ped_intra",
    label: "Подслизистый: узел на ножке внутри полости (без интрамуральной части)",
    slot: "pedunculatedIntracavitary",
    slotValue: true,
  },
  {
    id: "ext_intra",
    label: "Подслизистый: интрамуральное распространение",
    hint: "<50% → FIGO 1, ≥50% → FIGO 2",
    slot: "intramuralExtension",
  },
  {
    id: "endo_contact",
    label: "Интрамуральный: узел контактирует с эндометрием",
    slot: "contactsEndometrium",
    slotValue: true,
  },
  {
    id: "ped_sub",
    label: "Субсерозный: узел на ножке",
    slot: "pedunculatedSubserosal",
    slotValue: true,
  },
  {
    id: "ext_sub",
    label: "Субсерозный: интрамуральное распространение",
    hint: "≥50% → FIGO 5, <50% → FIGO 6",
    slot: "subserosalExtension",
  },
];

export const VISION_CHECKLISTS: Record<string, VisionChecklist> = {
  adnexa: {
    nosology: "adnexa",
    title: "Образование придатков — чеклист лексикона O-RADS/IOTA",
    instruction:
      "Отметьте признаки, которые видны на снимке. Категорию O-RADS рассчитает движок из отмеченных признаков — ИИ не ставит категорию.",
    items: [
      { id: "uni", label: "Однокамерное, безэховое содержимое, гладкая стенка" },
      { id: "multi", label: "Многокамерное" },
      { id: "solid", label: "Солидный компонент" },
      { id: "solid_reg", label: "Солидный компонент с нерегулярным контуром" },
      { id: "low_echo", label: "Однородные низкоуровневые внутренние эхосигналы (типа эндометриомы)" },
      { id: "hypo_shad", label: "Гиперэхогенный компонент с тенью (типа тератомы)" },
      { id: "acites", label: "Асцит / свободная жидкость" },
      { id: "cs", label: "Color score (васкуляризация)", hint: "1 — минимальная · 2 — умеренная · 3 — выраженная вокруг · 4 — внутри и вокруг" },
      { id: "size", label: "Наибольший размер, см", slot: "sizeCm" },
    ],
    citation: { organization: "ACR/IOTA", document: "O-RADS US v2022 лексикон + IOTA simple rules", year: 2022, status: "учебный пересказ" },
    note: "Категория O-RADS присваивается по лексикону и размеру; категории 4–5 — онкологический маршрут. Решение за врачом.",
  },
  breast: {
    nosology: "breast",
    title: "Образование молочной железы — чеклист BI-RADS",
    instruction:
      "Отметьте видимые признаки лексикона BI-RADS. Подкатегорию 4A/4B/4C определяет врач/движок — ИИ не ставит категорию.",
    items: [
      { id: "orient", label: "Ориентация к коже", hint: "параллельная / непараллельная" },
      { id: "shape", label: "Форма", hint: "овоидная / округлая / неправильная" },
      { id: "margin", label: "Край", hint: "гладкий / неровный / микролобулярный" },
      { id: "echo", label: "Эхоплотность", hint: "анэхогенная / гипер-/гипо-/изоэхогенная / смешанная" },
      { id: "posterior", label: "Задние эффекты", hint: "нет / усиление / ослабление (тень)" },
      { id: "duct", label: "Связь с протоком / изменением кожи" },
      { id: "vasc", label: "Васкуляризация" },
    ],
    citation: { organization: "ACR", document: "BI-RADS Atlas, УЗИ-приложение", year: 2025, status: "учебный пересказ" },
    note: "Категория 4 и выше — показание к биопсии; подкатегории 4A/4B/4C — по вероятности злокачественности. Решение за врачом.",
  },
  thyroid: {
    nosology: "thyroid",
    title: "Узел щитовидной железы — чеклист ACR TI-RADS",
    instruction:
      "Отметьте признаки лексикона; баллы и категорию TR1–TR5 считает движок/врач — ИИ не ставит категорию.",
    items: [
      { id: "comp", label: "Композиция", hint: "кистозная / кистозно-солидная / почти полностью солидная / солидная" },
      { id: "echo", label: "Эхогенность", hint: "безэховая / гипер-/изо-/гипоэхогенная / очень гипоэхогенная" },
      { id: "shape", label: "Форма шире, чем выше (в поперечнике)", slot: "tallerWide", slotValue: true },
      { id: "margin", label: "Край", hint: "гладкий / неровный / лобулярный / инфильтративный" },
      { id: "foci_micro", label: "Микрокальцинаты", slot: "microcalcifications", slotValue: true },
      { id: "foci_ring", label: "Кольцевидные эхогенные фокусы" },
      { id: "extra", label: "Внекапсульное распространение / подозрительные лимфоузлы" },
    ],
    citation: { organization: "ACR", document: "Tessler FN et al. — ACR TI-RADS (JACR 2017)", year: 2017, status: "учебный пересказ" },
    note: "Пороги FNA: TR3 ≥2.5 см, TR4 ≥1.5 см, TR5 ≥1.0 см. Решение за врачом.",
  },
  uterus: {
    nosology: "uterus",
    title: "Миома матки — чеклист FIGO 0–8",
    instruction:
      "Отметьте локализацию и ветвные признаки; тип FIGO рассчитает движок uterus_myoma_figo.",
    items: UTERUS_FIGO_ITEMS,
    tool: "uterus_myoma_figo",
    citation: { organization: "FIGO", document: "Munro MG et al. — FIGO классификация миомы 0–8", year: 2018, status: "учебный пересказ" },
    note: "Тип определяет доступ и тактику; итоговое решение за врачом.",
  },
};

export function visionChecklist(nosology: string): VisionChecklist | undefined {
  return VISION_CHECKLISTS[nosology];
}

export function visionChecklistNosologies(): string[] {
  return Object.keys(VISION_CHECKLISTS);
}
