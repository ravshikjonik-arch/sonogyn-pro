import type { BloodFlow, OradsInput, OradsResult } from "../types";

function toCm(mm?: number): number | null {
  if (typeof mm !== "number" || !Number.isFinite(mm) || mm <= 0) return null;
  return mm / 10;
}

function calcVolumeMl(lengthMm?: number, widthMm?: number, heightMm?: number): number | null {
  if (![lengthMm, widthMm, heightMm].every((v) => typeof v === "number" && Number.isFinite(v) && (v as number) > 0)) {
    return null;
  }
  return Number((((lengthMm as number) * (widthMm as number) * (heightMm as number) * 0.523) / 1000).toFixed(2));
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
    1: "Физиологическое",
    2: "Почти доброкачественное (<1%)",
    3: "Низко-промежуточный риск (1-10%)",
    4: "Подозрительный риск (10-50%)",
    5: "Высокий риск (>50%)",
  };

  const recommendationByCategory: Record<OradsResult["category"], string> = {
    1: "Рутинное наблюдение.",
    2: "Динамическое наблюдение по локальному протоколу.",
    3: "Контроль и дообследование (экспертное УЗИ/МРТ по показаниям).",
    4: "Направление к профильному гинекологу/онкогинекологу.",
    5: "Срочная консультация онкогинеколога и стадирование.",
  };

  const reclassNote =
    "O-RADS US v2022: неполная перегородка во 2-й плоскости — пересчёт как однокамерное.";

  return {
    category,
    riskText: riskTextByCategory[category],
    recommendation: recommendationByCategory[category],
    rationale: structureReclassified ? `${reclassNote} ${rationale}` : rationale,
    volumeMl,
    structureReclassified: structureReclassified || undefined,
    warning: structureReclassified ? reclassNote : undefined,
  };
}

export function buildReportText(input: OradsInput, result: OradsResult): string {
  const dims = [input.lengthMm, input.widthMm, input.heightMm].every((v) => typeof v === "number" && v > 0)
    ? `${input.lengthMm}×${input.widthMm}×${input.heightMm} мм`
    : "не указаны";

  return [
    `O-RADS: ${result.category} (${result.riskText})`,
    `Локализация: ${input.localization === "extraovarian" ? "Экстраовариальная" : "Овариальная/аднексальная"}`,
    `Размеры: ${dims}`,
    `Объем: ${result.volumeMl == null ? "не рассчитан" : `${result.volumeMl} мл`}`,
    `Асцит: ${input.ascites ? "да" : "нет"}`,
    `Кровоток: ${input.bloodFlow ?? "не указан"}`,
    `Обоснование: ${result.rationale}`,
    `Рекомендации: ${result.recommendation}`,
  ].join("\n");
}
