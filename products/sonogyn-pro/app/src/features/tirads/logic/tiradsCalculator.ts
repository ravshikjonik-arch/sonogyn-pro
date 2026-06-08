/** ACR TI-RADS (2017) — балльная система для образований щитовидной железы (УЗИ). Образовательный расчёт; клинические решения — врачу. */

export const TI_RADS_VERSION = "ACR TI-RADS 2017";

export type TiradsComposition = "cystic" | "spongiform" | "mixed" | "solid" | "indeterminate";
export type TiradsEchogenicity = "anechoic" | "hyperechoic_isoechoic" | "hypoechoic" | "very_hypoechoic";
export type TiradsShape = "wider" | "taller";
export type TiradsMargin = "smooth" | "lobulated_irregular" | "ete";
/** Один вариант очаговых включений с максимальным весом (по логике атласа ACR). */
export type TiradsFoci = "none" | "comet_small" | "coarse" | "rim" | "punctate";

export type TiradsInput = {
  composition: TiradsComposition;
  echogenicity: TiradsEchogenicity;
  shape: TiradsShape;
  margin: TiradsMargin;
  echogenicFoci: TiradsFoci;
  /** Наибольший размер узла, мм (для порогов FNA по ACR). */
  largestDiameterMm?: number;
};

export const defaultTiradsInput: TiradsInput = {
  composition: "mixed",
  echogenicity: "hypoechoic",
  shape: "wider",
  margin: "smooth",
  echogenicFoci: "none",
  largestDiameterMm: undefined,
};

const COMPOSITION_POINTS: Record<TiradsComposition, number> = {
  cystic: 0,
  spongiform: 0,
  mixed: 1,
  solid: 2,
  indeterminate: 2,
};

const ECHOGENICITY_POINTS: Record<TiradsEchogenicity, number> = {
  anechoic: 0,
  hyperechoic_isoechoic: 1,
  hypoechoic: 2,
  very_hypoechoic: 3,
};

const SHAPE_POINTS: Record<TiradsShape, number> = {
  wider: 0,
  taller: 3,
};

const MARGIN_POINTS: Record<TiradsMargin, number> = {
  smooth: 0,
  lobulated_irregular: 2,
  ete: 3,
};

const FOCI_POINTS: Record<TiradsFoci, number> = {
  none: 0,
  comet_small: 1,
  coarse: 1,
  rim: 2,
  punctate: 3,
};

function echogenicityContribution(composition: TiradsComposition, echogenicity: TiradsEchogenicity): number {
  if (composition === "cystic" || composition === "spongiform") return 0;
  return ECHOGENICITY_POINTS[echogenicity];
}

export function sumTiradsPoints(input: TiradsInput): number {
  return (
    COMPOSITION_POINTS[input.composition] +
    echogenicityContribution(input.composition, input.echogenicity) +
    SHAPE_POINTS[input.shape] +
    MARGIN_POINTS[input.margin] +
    FOCI_POINTS[input.echogenicFoci]
  );
}

export type TiradsCategory = "TR1" | "TR2" | "TR3" | "TR4" | "TR5";

export function categoryFromPoints(points: number): TiradsCategory {
  if (points <= 0) return "TR1";
  if (points <= 2) return "TR2";
  if (points === 3) return "TR3";
  if (points <= 6) return "TR4";
  return "TR5";
}

const CATEGORY_LABEL: Record<TiradsCategory, string> = {
  TR1: "Доброкачественно (0 баллов)",
  TR2: "Не подозрительно (1–2 балла)",
  TR3: "Слабо подозрительно (3 балла)",
  TR4: "Умеренно подозрительно (4–6 баллов)",
  TR5: "Высоко подозрительно (≥7 баллов)",
};

const CATEGORY_RISK: Record<TiradsCategory, string> = {
  TR1: "Риск злокачественности: пренебрежимо малый (ориентир для образования).",
  TR2: "Риск злокачественности: низкий (часто <2% в когортах с биопсией по показаниям).",
  TR3: "Риск злокачественности: низкий–умеренный (зависит от размера и клиники).",
  TR4: "Риск злокачественности: умеренный (часто порядка нескольких–15% в зависимости от серии).",
  TR5: "Риск злокачественности: высокий (часто существенно выше; решение по FNA при меньшем размере).",
};

/** Пороги FNA по максимальному диаметру (ACR 2017), в мм. */
function fnaThresholdMm(cat: TiradsCategory): number | null {
  if (cat === "TR1" || cat === "TR2") return null;
  if (cat === "TR3") return 25;
  if (cat === "TR4") return 15;
  return 10;
}

export type TiradsResult = {
  points: number;
  category: TiradsCategory;
  categoryLabel: string;
  riskNarrative: string;
  fnaThresholdMm: number | null;
  fnaRecommendation: string;
  surveillanceHint: string;
};

export function evaluateTirads(input: TiradsInput): TiradsResult {
  const points = sumTiradsPoints(input);
  const category = categoryFromPoints(points);
  const threshold = fnaThresholdMm(category);
  const d = input.largestDiameterMm;

  let fnaRecommendation: string;
  if (threshold === null) {
    fnaRecommendation = "Тонкоигольная аспирационная биопсия (ТАБ) по TI-RADS обычно не показана только из-за категории. Решение — клинико-лабораторно.";
  } else if (d === undefined || !Number.isFinite(d) || d <= 0) {
    fnaRecommendation = `Укажите наибольший размер узла (мм): при ≥ ${threshold} мм для ${category} рассматривают ТАБ по протоколу ACR 2017.`;
  } else if (d >= threshold) {
    fnaRecommendation = `При размере ${d} мм (≥ ${threshold} мм для ${category}) по критериям ACR 2017 обычно рассматривают ТАБ (с учётом клиники, узловых статусов, анамнеза).`;
  } else {
    fnaRecommendation = `Размер ${d} мм ниже типичного порога ТАБ для ${category} (${threshold} мм). Часто достаточно динамического наблюдения — по местным протоколам и эндокринологу.`;
  }

  const surveillanceHint =
    category === "TR5" || category === "TR4"
      ? "Плотный УЗ-контроль и/или ТАБ по показаниям; при TR5 — низкий порог для уточнения даже при небольшом размере."
      : category === "TR3"
        ? "Контрольное УЗИ через 6–12 месяцев или раньше при росте/симптомах — по согласованию с врачом."
        : "Рутинное наблюдение по клинической ситуации.";

  return {
    points,
    category,
    categoryLabel: CATEGORY_LABEL[category],
    riskNarrative: CATEGORY_RISK[category],
    fnaThresholdMm: threshold,
    fnaRecommendation,
    surveillanceHint,
  };
}

const RU_COMP: Record<TiradsComposition, string> = {
  cystic: "кистозный / почти кистозный",
  spongiform: "губчатый",
  mixed: "смешанный",
  solid: "твёрдый / почти твёрдый",
  indeterminate: "не определить",
};
const RU_ECHO: Record<TiradsEchogenicity, string> = {
  anechoic: "анэхоидный",
  hyperechoic_isoechoic: "гипер- или изоэхогенный",
  hypoechoic: "гипоэхогенный",
  very_hypoechoic: "очень гипоэхогенный",
};
const RU_MARGIN: Record<TiradsMargin, string> = {
  smooth: "ровный / нечёткий",
  lobulated_irregular: "дольчатый / неровный",
  ete: "экстратиреоидное распространение",
};
const RU_FOCI: Record<TiradsFoci, string> = {
  none: "нет / крупный комет-хвост",
  comet_small: "мелкий комет-хвост",
  coarse: "крупные кальцификаты",
  rim: "периферический (rim) кальций",
  punctate: "пунктатные микрокальцификаты",
};

export function buildTiradsReportText(input: TiradsInput, res: TiradsResult): string {
  const echoNote =
    input.composition === "cystic" || input.composition === "spongiform"
      ? " (балл за эхогенность не суммируется по ACR)"
      : "";
  const lines = [
    `Щитовидная железа · ${TI_RADS_VERSION}`,
    `Баллы: ${res.points} → ${res.category} (${res.categoryLabel})`,
    "",
    "Параметры:",
    `- Композиция: ${RU_COMP[input.composition]}`,
    `- Эхогенность: ${RU_ECHO[input.echogenicity]}${echoNote}`,
    `- Форма: ${input.shape === "wider" ? "шире, чем выше" : "выше, чем шире"}`,
    `- Контур: ${RU_MARGIN[input.margin]}`,
    `- Эхогенные включения: ${RU_FOCI[input.echogenicFoci]}`,
    input.largestDiameterMm != null && Number.isFinite(input.largestDiameterMm)
      ? `- Наибольший размер: ${input.largestDiameterMm} мм`
      : "- Наибольший размер: не указан",
    "",
    res.riskNarrative,
    "",
    "FNA:",
    res.fnaRecommendation,
    "",
    "Наблюдение:",
    res.surveillanceHint,
    "",
    "Дисклеймер: расчёт носит справочный характер; не заменяет заключение врача и локальные клинические рекомендации.",
  ];
  return lines.join("\n");
}
