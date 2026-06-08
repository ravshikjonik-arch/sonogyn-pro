/**
 * Алгоритм УЗИ молочной железы по BI-RADS — брошюра цикла
 * Солнцева И.А., BI-RADS v2025 (практическое руководство), Санкт-Петербург 2026.
 * Учебный протокол; итоговая категория — решение врача.
 */

import { biradsOptions, buildBiradsDecisionPath, evaluateBirads, type BiradsInput } from "./birads";
import type { RiskResult } from "./types";

export const BIRADS_BROCHURE_SOURCE =
  "Солнцева И.А. Алгоритм УЗИ МЖ по BI-RADS v2025 (брошюра цикла, СПб 2026). ACR BI-RADS US — ориентир категорий.";

export type BiradsBrochureInput = BiradsInput & {
  prevailingTissue?: string;
  gtcAmount?: string;
  calcifications?: string;
  associatedFeatures?: string[];
  elastographyStiffness?: string;
  specialCase?: string;
  lymphNodeSites?: string[];
  lymphNodeShape?: string;
  lymphNodeCortex?: string;
  lymphNodeMargin?: string;
  lymphNodeHilum?: string;
  lymphNodeEchogenicInclusions?: boolean;
  lymphNodeSymmetryNote?: string;
  conclusionMode?: "us_only" | "combined_mmg_us";
  conclusionDraft?: string;
  biradsCategoryManual?: string;
  localizationText?: string;
};

type Opt = { value: string; label: string };

export const brochureOptions = {
  prevailingTissue: [
    { value: "fatty_homogeneous", label: "Гомогенная жировая эхоструктура" },
    { value: "fibroglandular_homogeneous", label: "Гомогенная фиброгландулярная эхоструктура" },
    { value: "heterogeneous", label: "Гетерогенная эхоструктура" },
  ] as Opt[],
  gtcAmount: [
    { value: "minimal", label: "Минимальное (<25%)" },
    { value: "mild", label: "Незначительное (25–49%)" },
    { value: "moderate", label: "Умеренное (50–74%)" },
    { value: "pronounced", label: "Выраженное (>75%)" },
  ] as Opt[],
  calcifications: [
    { value: "none", label: "Кальцификаты не описаны" },
    { value: "macro", label: "Макрокальцификаты" },
    { value: "micro_in_lesion", label: "Микрокальцификаты — в образовании или NML" },
    { value: "micro_outside", label: "Микрокальцификаты — вне образования или NML" },
    { value: "intraductal_outside", label: "Внутрипротоковые, вне образования" },
  ] as Opt[],
  associatedFeatures: [
    { value: "architectural_distortion", label: "Нарушение архитектоники" },
    { value: "malignant_pseudocapsule", label: "Злокачественная псевдокапсула" },
    { value: "echogenic_rim", label: "Эхогенный ободок" },
    { value: "skin_thickening", label: "Изменения кожи: утолщение" },
    { value: "skin_retraction", label: "Изменения кожи: втяжение" },
    { value: "duct_changes", label: "Изменения млечных протоков" },
    { value: "edema", label: "Отёк" },
    { value: "vascular_none", label: "Васкуляризация: отсутствует" },
    { value: "vascular_internal", label: "Васкуляризация: внутренняя" },
    { value: "vascular_peripheral", label: "Васкуляризация: усиленная периферическая" },
  ] as Opt[],
  elastographyStiffness: [
    { value: "not_done", label: "Эластография не выполнялась" },
    { value: "soft", label: "Мягкое" },
    { value: "intermediate", label: "Средней жёсткости" },
    { value: "hard", label: "Жёсткое" },
  ] as Opt[],
  specialCase: [
    { value: "none", label: "Нет (стандартное описание образования)" },
    { value: "simple_cyst", label: "Простая киста" },
    { value: "microcyst_cluster", label: "Кластер микрокист" },
    { value: "complicated_cyst", label: "Осложнённая киста" },
    { value: "skin_lesion", label: "Образование в/на коже" },
    { value: "foreign_body", label: "Инородное тело" },
    { value: "implant", label: "Импланты" },
    { value: "intramammary_ln", label: "Интрамаммарный лимфоузел" },
    { value: "fat_necrosis", label: "Жировой некроз" },
    { value: "postoperative", label: "Постоперационные изменения" },
    { value: "abscess", label: "Абсцесс" },
    { value: "vascular_anomaly", label: "Сосудистые аномалии" },
  ] as Opt[],
  lymphNodeSites: [
    { value: "intramammary", label: "Интрамаммарные" },
    { value: "axilla_I", label: "Аксиллярные I уровня" },
    { value: "axilla_II", label: "Аксиллярные II уровня" },
    { value: "axilla_III", label: "Аксиллярные III уровня" },
    { value: "supraclavicular", label: "Надключичные" },
    { value: "internal_mammary", label: "Внутренние (парастернальные)" },
  ] as Opt[],
  lymphNodeShape: [
    { value: "oval", label: "Овальная" },
    { value: "round", label: "Округлая" },
    { value: "lobulated", label: "Дольчатая" },
    { value: "irregular", label: "Неправильная" },
  ] as Opt[],
  lymphNodeCortex: [
    { value: "normal", label: "Кора ≤3 мм" },
    { value: "diffuse", label: "Утолщение >3 мм: диффузное" },
    { value: "uniform", label: "Равномерное" },
    { value: "concentric", label: "Концентрическое" },
    { value: "focal", label: "Очаговое" },
    { value: "eccentric", label: "Эксцентрическое" },
  ] as Opt[],
  lymphNodeMargin: [
    { value: "circumscribed", label: "Чёткие" },
    { value: "indistinct", label: "Нечёткие" },
  ] as Opt[],
  lymphNodeHilum: [
    { value: "preserved", label: "Ворота сохранены" },
    { value: "compressed", label: "Сдавление ворот" },
    { value: "displaced", label: "Смещение ворот" },
    { value: "replaced", label: "Замещение ворот" },
  ] as Opt[],
  conclusionMode: [
    { value: "us_only", label: "Заключение только по УЗИ" },
    { value: "combined_mmg_us", label: "Комбинированное (ММГ + УЗИ)" },
  ] as Opt[],
  biradsCategoryManual: [
    { value: "0", label: "0 — неполная оценка / нужны доп. исследования" },
    { value: "1", label: "1 — отрицательная" },
    { value: "2", label: "2 — доброкачественная" },
    { value: "3", label: "3 — вероятно доброкачественная" },
    { value: "4A", label: "4A — подозрительная (низкая)" },
    { value: "4B", label: "4B — подозрительная (промежуточная)" },
    { value: "4C", label: "4C — подозрительная (высокая)" },
    { value: "5", label: "5 — высокая вероятность ЗНО" },
    { value: "6", label: "6 — верифицированная ЗНО" },
  ] as Opt[],
} as const;

export const BIRADS_CATEGORY_RECOMMENDATIONS: Record<string, string> = {
  "0": "Требуется дополнительная визуализация и/или сравнение с предыдущими исследованиями.",
  "1": "Вероятность злокачественности 0%. Рутинный скрининг.",
  "2": "Вероятность злокачественности 0%. Рутинный скрининг.",
  "3": "Вероятность ЗНО >0% и ≤2%. Короткий интервал наблюдения (часто 6 мес.) или продолжение наблюдения 12 мес.",
  "4A": "Вероятность ЗНО >2% и ≤10%. Морфологическая верификация по показаниям.",
  "4B": "Вероятность ЗНО >10% и ≤50%. Морфологическая верификация.",
  "4C": "Вероятность ЗНО >50% и <95%. Морфологическая верификация.",
  "5": "Вероятность ЗНО >95%. Морфологическая верификация, онкомаршрут.",
  "6": "Морфологически верифицированная злокачественность. Наблюдение хирурга/онколога, лечение.",
};

export const BIRADS_BROCHURE_STEPS = [
  { id: 1, title: "Шаг 1", subtitle: "Общая структура МЖ" },
  { id: 2, title: "Шаг 2", subtitle: "Выявленные изменения (mass / NML)" },
  { id: 3, title: "Шаг 3", subtitle: "Кальцификаты" },
  { id: 4, title: "Шаг 4", subtitle: "Сопутствующие признаки" },
  { id: 5, title: "Шаг 5", subtitle: "Особые случаи" },
  { id: 6, title: "Шаг 6", subtitle: "Регионарные ЛУ" },
  { id: 7, title: "Шаг 7", subtitle: "Заключение" },
  { id: 8, title: "Шаг 8", subtitle: "Категория BI-RADS" },
] as const;

export const defaultBiradsBrochureInput: BiradsBrochureInput = {
  findingType: "mass",
  shape: "oval",
  margin: "circumscribed",
  echoPattern: "anechoic",
  vascularity: "none",
  orientation: "parallel",
  posteriorFeatures: "none",
  nonMassEchogenicity: "not_applicable",
  nonMassDistribution: "not_applicable",
  nonMassAssociatedFeatures: "not_applicable",
  prevailingTissue: undefined,
  gtcAmount: undefined,
  calcifications: "none",
  associatedFeatures: [],
  elastographyStiffness: "not_done",
  specialCase: "none",
  lymphNodeSites: [],
  conclusionMode: "us_only",
  biradsCategoryManual: undefined,
};

function labelFor(opts: Opt[], value?: string) {
  return opts.find((o) => o.value === value)?.label ?? value ?? "—";
}

function labelMassField(key: keyof BiradsInput, value?: string) {
  const opts = biradsOptions[key as keyof typeof biradsOptions];
  if (!opts) return value ?? "—";
  return opts.find((o) => o.value === value)?.label ?? value ?? "—";
}

function syncVascularityFromAssociated(input: BiradsBrochureInput): BiradsInput {
  const af = input.associatedFeatures ?? [];
  let vascularity = input.vascularity;
  if (af.includes("vascular_internal")) vascularity = "marked";
  else if (af.includes("vascular_peripheral")) vascularity = "mild";
  else if (af.includes("vascular_none")) vascularity = "none";
  return { ...input, vascularity };
}

export function evaluateBiradsBrochure(input: BiradsBrochureInput): RiskResult {
  return evaluateBirads(syncVascularityFromAssociated(input));
}

function mapManualCategory(code?: string): RiskResult | null {
  if (!code) return null;
  const rec = BIRADS_CATEGORY_RECOMMENDATIONS[code];
  const risk =
    code === "1" || code === "2"
      ? "0%"
      : code === "3"
        ? "≤2%"
        : code === "4A"
          ? "2–10%"
          : code === "4B"
            ? "10–50%"
            : code === "4C"
              ? "50–95%"
              : code === "5"
                ? ">95%"
                : code === "6"
                  ? "верифицирована"
                  : "—";
  return {
    category: `BI-RADS ${code}`,
    riskRange: risk,
    description: rec ?? "",
    impression: rec ?? "Тактика по категории BI-RADS и клиническому контексту.",
  };
}

export function resolveBiradsBrochureCategory(
  input: BiradsBrochureInput,
  auto: RiskResult,
): RiskResult {
  if (input.specialCase && input.specialCase !== "none") {
    if (input.specialCase === "simple_cyst" || input.specialCase === "intramammary_ln") {
      return mapManualCategory("2") ?? auto;
    }
    if (input.specialCase === "complicated_cyst" || input.specialCase === "abscess") {
      return mapManualCategory("4A") ?? auto;
    }
  }
  if (input.biradsCategoryManual) {
    return mapManualCategory(input.biradsCategoryManual) ?? auto;
  }
  return auto;
}

export function buildBiradsBrochureProtocol(input: BiradsBrochureInput): string {
  const auto = evaluateBiradsBrochure(input);
  const result = resolveBiradsBrochureCategory(input, auto);
  const lines: string[] = [
    "ПРОТОКОЛ УЗИ МОЛОЧНОЙ ЖЕЛЕЗЫ (алгоритм BI-RADS v2025)",
    BIRADS_BROCHURE_SOURCE,
    "",
  ];

  if (input.localizationText?.trim()) {
    lines.push("ЛОКАЛИЗАЦИЯ", input.localizationText.trim(), "");
  }

  lines.push(
    "ШАГ 1. Общая структура молочной железы",
    `Преобладающий тип: ${labelFor(brochureOptions.prevailingTissue, input.prevailingTissue)}`,
    `Железистая ткань (GTC): ${labelFor(brochureOptions.gtcAmount, input.gtcAmount)}`,
    "",
    "ШАГ 2. Выявленные изменения",
  );

  if (input.findingType === "non_mass") {
    lines.push(
      "Тип: не узловое поражение (NML) — зона изменения эхоструктуры без объёмного эффекта и без чётких границ.",
      `Распределение: ${labelMassField("nonMassDistribution", input.nonMassDistribution)}`,
      `Эхоструктура: ${labelMassField("nonMassEchogenicity", input.nonMassEchogenicity)}`,
      `Ассоциированные признаки NML: ${labelMassField("nonMassAssociatedFeatures", input.nonMassAssociatedFeatures)}`,
    );
  } else {
    lines.push(
      "Тип: очаговое образование (mass) — 5 обязательных дескрипторов:",
      `1) Форма: ${labelMassField("shape", input.shape)}`,
      `2) Ориентация: ${labelMassField("orientation", input.orientation)}`,
      `3) Контуры: ${labelMassField("margin", input.margin)}`,
      `4) Эхоструктура: ${labelMassField("echoPattern", input.echoPattern)}`,
      `5) Дорзальные эффекты: ${labelMassField("posteriorFeatures", input.posteriorFeatures)}`,
    );
  }

  lines.push(
    "",
    "ШАГ 3. Кальцификаты",
    labelFor(brochureOptions.calcifications, input.calcifications),
    "",
    "ШАГ 4. Сопутствующие признаки",
  );

  const af = (input.associatedFeatures ?? [])
    .map((v) => labelFor(brochureOptions.associatedFeatures, v))
    .filter((l) => !l.startsWith("Васкуляризация"));
  lines.push(
    af.length ? af.map((x) => `• ${x}`).join("\n") : "Сопутствующие признаки не отмечены.",
    `Эластография: ${labelFor(brochureOptions.elastographyStiffness, input.elastographyStiffness)}`,
    "",
    "ШАГ 5. Особые случаи",
    labelFor(brochureOptions.specialCase, input.specialCase),
    "",
    "ШАГ 6. Регионарные лимфатические узлы",
  );

  const lnSites = (input.lymphNodeSites ?? []).map((v) => labelFor(brochureOptions.lymphNodeSites, v));
  if (lnSites.length) {
    lines.push(
      `Локализация: ${lnSites.join("; ")}`,
      `Форма: ${labelFor(brochureOptions.lymphNodeShape, input.lymphNodeShape)}`,
      `Кора: ${labelFor(brochureOptions.lymphNodeCortex, input.lymphNodeCortex)}`,
      `Края: ${labelFor(brochureOptions.lymphNodeMargin, input.lymphNodeMargin)}`,
      `Ворота: ${labelFor(brochureOptions.lymphNodeHilum, input.lymphNodeHilum)}`,
      input.lymphNodeEchogenicInclusions ? "Эхогенные включения: да" : "Эхогенные включения: нет",
      input.lymphNodeSymmetryNote?.trim()
        ? `Симметричность / динамика: ${input.lymphNodeSymmetryNote.trim()}`
        : "Симметричность справа/слева — оценить; учесть интервальные изменения и клинику.",
    );
  } else {
    lines.push("Визуализированные регионарные ЛУ по протоколу не описаны / без патологических изменений.");
  }

  lines.push(
    "",
    "ШАГ 7. Заключение",
    input.conclusionMode === "combined_mmg_us"
      ? "Формат: комбинированное заключение (маммография + УЗИ)."
      : "Формат: заключение по результатам УЗИ.",
    input.conclusionDraft?.trim() || "(текст заключения врача)",
    "",
    "ШАГ 8. Категория BI-RADS",
    `${result.category} (${result.riskRange})`,
    result.description,
    `Рекомендации: ${result.impression}`,
  );

  if (input.biradsCategoryManual) {
    const rec = BIRADS_CATEGORY_RECOMMENDATIONS[input.biradsCategoryManual];
    if (rec) lines.push(`Тактика по таблице брошюры: ${rec}`);
  }

  lines.push(
    "",
    "---",
    "Автоматическая оценка по дескрипторам mass (ruleset):",
    `${auto.category} — ${auto.impression}`,
    "",
    "Не является диагнозом. Окончательная формулировка и категория — за лечащим врачом.",
  );

  return lines.join("\n");
}

export function buildBiradsBrochureChecklist(input: BiradsBrochureInput): string[] {
  const base = buildBiradsDecisionPath(syncVascularityFromAssociated(input));
  return [
    "Чеклист по брошюре BI-RADS v2025 (8 шагов):",
    ...BIRADS_BROCHURE_STEPS.map((s) => `${s.title}: ${s.subtitle}`),
    "",
    ...base,
  ];
}
