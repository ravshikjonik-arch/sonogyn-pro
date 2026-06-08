export type LnRadsLocation = "neck" | "axillary" | "inguinal" | "abdominal";
export type LnRadsHilum = "present" | "absent";
export type LnRadsShape = "oval" | "round";
export type LnRadsEchogenicity = "normal" | "hypoechoic" | "heterogeneous";
export type LnRadsVascularity = "hilar" | "peripheral" | "mixed" | "absent";
export type LnRadsBorders = "clear" | "irregular";

export type LnRadsInput = {
  location: LnRadsLocation;
  length_mm: number;
  short_axis_mm: number;
  hilum: LnRadsHilum;
  cortex_thickness_mm: number;
  shape: LnRadsShape;
  echogenicity: LnRadsEchogenicity;
  vascularity: LnRadsVascularity;
  borders: LnRadsBorders;
  calcifications: boolean;
  necrosis: boolean;
  conglomerate: boolean;
};

export type LnRadsCategory = 1 | 2 | 3 | 4 | 5;

export const LN_RADS_VERSION =
  "LN-RADS v1 (локальный прототип по пользовательскому алгоритму; не официальный международный стандарт)";

function mapCategory(score: number): LnRadsCategory {
  if (score <= 1) return 1;
  if (score <= 3) return 2;
  if (score <= 5) return 3;
  if (score <= 8) return 4;
  return 5;
}

function categoryInfo(c: LnRadsCategory): { risk: string; title: string } {
  switch (c) {
    case 1:
      return { risk: "0%", title: "Нормальный лимфатический узел" };
    case 2:
      return { risk: "<5%", title: "Доброкачественный" };
    case 3:
      return { risk: "~10%", title: "Вероятно доброкачественный" };
    case 4:
      return { risk: "20–50%", title: "Подозрительный" };
    case 5:
      return { risk: ">80%", title: "Высокий риск злокачественности" };
  }
}

function locationRu(v: LnRadsLocation): string {
  if (v === "neck") return "Шейные";
  if (v === "axillary") return "Подмышечные";
  if (v === "inguinal") return "Паховые";
  return "Абдоминальные";
}

export function evaluateLnRads(input: LnRadsInput): {
  score: number;
  category: LnRadsCategory;
  risk: string;
  title: string;
  lOverS: number | null;
  decisionPath: string[];
  protocol: string;
} {
  let score = 0;
  const steps: string[] = [];
  const ls =
    input.short_axis_mm > 0 ? input.length_mm / input.short_axis_mm : null;

  if (input.hilum === "absent") {
    score += 3;
    steps.push("Хилус отсутствует: +3");
  }
  if (input.shape === "round") {
    score += 1;
    steps.push("Округлая форма: +1");
  }
  if (ls !== null && ls < 2) {
    score += 1;
    steps.push("L/S < 2: +1");
  }
  if (input.cortex_thickness_mm > 3) {
    score += 1;
    steps.push("Кора > 3 мм: +1");
  }
  if (input.echogenicity === "heterogeneous") {
    score += 2;
    steps.push("Гетерогенная эхоструктура: +2");
  } else if (input.echogenicity === "hypoechoic") {
    score += 1;
    steps.push("Гипоэхогенность: +1");
  }
  if (input.vascularity === "peripheral") {
    score += 2;
    steps.push("Периферический кровоток: +2");
  } else if (input.vascularity === "mixed") {
    score += 2;
    steps.push("Смешанный кровоток: +2");
  } else if (input.vascularity === "absent") {
    score += 1;
    steps.push("Отсутствие кровотока: +1");
  }
  if (input.borders === "irregular") {
    score += 2;
    steps.push("Неровные/нечёткие контуры: +2");
  }
  if (input.necrosis) {
    score += 3;
    steps.push("Признаки некроза: +3");
  }
  if (input.calcifications) {
    score += 2;
    steps.push("Кальцинаты: +2");
  }
  if (input.conglomerate) {
    score += 2;
    steps.push("Конгломераты: +2");
  }

  const category = mapCategory(score);
  const info = categoryInfo(category);
  const lsText = ls === null ? "н/д" : ls.toFixed(2);

  const protocol = [
    "Исследование: Лимфатические узлы",
    "",
    `Локализация: ${locationRu(input.location)}`,
    "",
    "Размеры:",
    `Длина: ${input.length_mm} мм`,
    `Толщина: ${input.short_axis_mm} мм`,
    `Соотношение L/S: ${lsText}`,
    "",
    "Структура:",
    `Хилус: ${input.hilum === "present" ? "сохранён" : "отсутствует"}`,
    `Кора: ${input.cortex_thickness_mm} мм`,
    `Эхогенность: ${input.echogenicity}`,
    "",
    `Контуры: ${input.borders}`,
    `Форма: ${input.shape}`,
    `Кровоток (ЦДК): ${input.vascularity}`,
    "",
    "Дополнительно:",
    `Кальцинаты: ${input.calcifications ? "да" : "нет"}`,
    `Некроз: ${input.necrosis ? "да" : "нет"}`,
    `Конгломераты: ${input.conglomerate ? "да" : "нет"}`,
    "",
    `Заключение: LN-RADS ${category} (${info.title}), риск ${info.risk}`,
  ].join("\n");

  return {
    score,
    category,
    risk: info.risk,
    title: info.title,
    lOverS: ls,
    decisionPath: steps.length > 0 ? steps : ["Существенных подозрительных баллов не набрано."],
    protocol,
  };
}
