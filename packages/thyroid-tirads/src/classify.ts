import type { TiradsRuCategory, TiradsRuInput, TiradsRuResult } from "./types";

const CATEGORY_META: Record<
  TiradsRuCategory,
  { label: string; risk: string; followUp: string }
> = {
  "1": {
    label: "TI-RADS 1 · без значимых изменений",
    risk: "0%",
    followUp: "Плановый осмотр / УЗИ по клинике.",
  },
  "2": {
    label: "TI-RADS 2 · доброкачественное образование",
    risk: "0%",
    followUp: "Плановое УЗИ ЩЖ 1 раз в 2 года; в группе риска — 1 раз в год.",
  },
  "3": {
    label: "TI-RADS 3 · низкий риск",
    risk: "2–4%",
    followUp:
      "Динамическое УЗИ 1 раз в год. При отрицательной динамике — перевод в категорию 3 или ТАБ по показаниям.",
  },
  "4": {
    label: "TI-RADS 4 · средний риск",
    risk: "6–17%",
    followUp:
      "ТАБ при гипоэхогенном узле ≥1,0–1,5 см. При Bethesda I–III — повторная пункция. При двукратно отрицательной цитологии — УЗИ через 2–3 мес, далее 1 раз в год.",
  },
  "5": {
    label: "TI-RADS 5 · высокий риск",
    risk: "26–87%",
    followUp:
      "ТАБ при ≥1,0 см (≥0,5 см в группе риска / подозрительные ЛУ). Высокоподозрительные узлы могут требовать ≥2 ТАБ до морфологического заключения.",
  },
};

function hasMajorMalignancySigns(input: TiradsRuInput): string[] {
  const signs: string[] = [];
  if (input.echogenicity === "markedly_hypoechoic") signs.push("значительно пониженная эхогенность");
  if (input.shape === "taller") signs.push("вертикальная ориентация (выше, чем шире)");
  if (["irregular", "lobulated", "microlobulated"].includes(input.margin)) {
    signs.push("неровный / дольчатый / микродольчатый контур");
  }
  if (input.calcification === "micro") signs.push("пунктатные микрокальцификаты");
  return signs;
}

function hasMinorMalignancySigns(input: TiradsRuInput): string[] {
  const signs: string[] = [];
  if (input.echogenicity === "hypoechoic") signs.push("гипоэхогенность");
  if (input.margin === "ill_defined") signs.push("нечёткие границы");
  if (input.calcification === "rim") signs.push("периферический кальцинат");
  if (input.vascularization === "pathological") signs.push("патологический сосудистый рисунок");
  if (input.elastography?.stiff) signs.push("повышенная жёсткость на эластографии");
  return signs;
}

function classifyCategory(input: TiradsRuInput, major: string[], minor: string[]): TiradsRuCategory {
  if (input.composition === "none") return "1";

  if (major.length > 0 && input.composition !== "simple_cyst") return "5";

  if (input.composition === "simple_cyst" || input.composition === "spongiform") {
    if (input.cysticWithSolidComponent && input.echogenicity === "hypoechoic") return "3";
    return "2";
  }

  if (input.composition === "mixed_cystic_solid") {
    if (major.length > 0) return "5";
    if (input.cysticWithSolidComponent || input.echogenicity === "hypoechoic") return "3";
    return "2";
  }

  // solid
  if (input.echogenicity === "iso_hyper") return "3";
  if (input.echogenicity === "hypoechoic") {
    if (minor.length >= 2 || input.largestDiameterMm !== undefined && input.largestDiameterMm >= 15) return "4";
    return "4";
  }
  if (input.echogenicity === "markedly_hypoechoic") return "5";

  return minor.length ? "4" : "3";
}

function fnaDecision(
  category: TiradsRuCategory,
  input: TiradsRuInput,
): { recommended: boolean; rationale: string } {
  const d = input.largestDiameterMm;
  const sizeText = d !== undefined && Number.isFinite(d) ? `${d} мм` : "размер не указан";

  if (category === "1" || category === "2") {
    return { recommended: false, rationale: "ТАБ по TI-RADS обычно не показана." };
  }

  if (category === "3") {
    if (input.cysticWithSolidComponent && d !== undefined && d >= 20) {
      return {
        recommended: true,
        rationale: `Кистозно-солидный узел ${sizeText} (≥20 мм) — рассмотреть ТАБ солидного компонента.`,
      };
    }
    return {
      recommended: false,
      rationale: "ТАБ при TI-RADS 3 — при кистозно-солидном узле >2 см или нарастании подозрительных признаков.",
    };
  }

  if (category === "4") {
    if (d === undefined) {
      return {
        recommended: true,
        rationale: "TI-RADS 4: укажите размер — ТАБ обычно при гипоэхогенном узле ≥1,0–1,5 см.",
      };
    }
    if (d >= 10) {
      return {
        recommended: true,
        rationale: `TI-RADS 4, узел ${sizeText} (≥10 мм) — ТАБ по протоколу пособия.`,
      };
    }
    return {
      recommended: false,
      rationale: `TI-RADS 4, узел ${sizeText} <10 мм — чаще динамическое наблюдение; решение за клиницистом.`,
    };
  }

  // category 5
  if (input.suspiciousLymphNodes) {
    return { recommended: true, rationale: "TI-RADS 5 + подозрительные регионарные ЛУ — ТАБ." };
  }
  if (d === undefined) {
    return { recommended: true, rationale: "TI-RADS 5 — укажите размер для уточнения порога ТАБ (≥10 мм или ≥5 мм в группе риска)." };
  }
  if (d >= 10) {
    return { recommended: true, rationale: `TI-RADS 5, узел ${sizeText} ≥10 мм — ТАБ.` };
  }
  if (input.highRiskPatient && d >= 5) {
    return { recommended: true, rationale: `TI-RADS 5, узел ${sizeText} ≥5 мм в группе риска — ТАБ.` };
  }
  if (d < 5) {
    return {
      recommended: false,
      rationale: `TI-RADS 5, узел ${sizeText} <5 мм вне группы риска — активное наблюдение каждые 3–6 мес.`,
    };
  }
  return {
    recommended: !!input.highRiskPatient,
    rationale: input.highRiskPatient
      ? `TI-RADS 5, узел ${sizeText} — в группе риска рассмотреть ТАБ.`
      : `TI-RADS 5, узел ${sizeText} 5–9 мм — наблюдение или ТАБ по клинике.`,
  };
}

function tiMdsHint(input: TiradsRuInput): string | undefined {
  const e = input.elastography;
  if (!e || e.mode === "none") return undefined;
  if (e.mode === "sw2" && e.emeanKpa !== undefined && e.emeanKpa > 48.3) {
    return "TI-MDS: повышенная жёсткость по 2D-SWE (Emean >48,3 кПа) — может повысить мультипараметрическую категорию до 3–4.";
  }
  if (e.stiff) {
    return "TI-MDS: признаки повышенной жёсткости — учитывать вместе с B-режимом; доп. данные не снижают категорию TI-RADS.";
  }
  return "TI-MDS: эластография вспомогательна; основа оценки — B-режим.";
}

export function evaluateTiradsRu(input: TiradsRuInput): TiradsRuResult {
  const majorSigns = hasMajorMalignancySigns(input);
  const minorSigns = hasMinorMalignancySigns(input);
  const category = classifyCategory(input, majorSigns, minorSigns);
  const meta = CATEGORY_META[category];
  const fna = fnaDecision(category, input);

  const rationale: string[] = [];
  if (majorSigns.length) rationale.push(`Крупные признаки: ${majorSigns.join("; ")}.`);
  if (minorSigns.length) rationale.push(`Дополнительные признаки: ${minorSigns.join("; ")}.`);
  if (!majorSigns.length && !minorSigns.length) rationale.push("Выраженных подозрительных признаков не отмечено.");

  return {
    category,
    categoryLabel: meta.label,
    malignancyRiskPercent: meta.risk,
    fnaRecommended: fna.recommended,
    fnaRationale: fna.rationale,
    followUp: meta.followUp,
    tiMdsHint: tiMdsHint(input),
    majorSigns,
    minorSigns,
    rationale,
  };
}
