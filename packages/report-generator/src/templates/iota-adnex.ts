import {
  calculateAdnex,
  calculateLr2,
  calculateSimpleRulesRisk,
  evaluateSimpleRules,
  type AdnexInput,
  type SimpleRulesFeature,
} from "@repo/iota-models";

import { REPORT_GENERATOR_DISCLAIMER_RU } from "../disclaimer";
import { MISSING_VALUE_RU, formatField, joinSections } from "../placeholders";
import type { CalculatorReportPayload, GeneratedReport } from "../types";

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function parseAdnexInput(raw: Record<string, unknown>): Partial<AdnexInput> {
  if (raw.adnex && typeof raw.adnex === "object") {
    return raw.adnex as Partial<AdnexInput>;
  }
  const ageYears = Number.parseInt(String(raw.ageYears ?? ""), 10);
  const maxDiameterMm = Number.parseFloat(String(raw.maxDiameterMm ?? "").replace(",", "."));
  const maxSolidDiameterMm = Number.parseFloat(String(raw.maxSolidMm ?? raw.maxSolidDiameterMm ?? "").replace(",", "."));
  const useCa125 = raw.useCa125 === true || raw.useCa125 === "true";
  const ca125Raw = Number.parseFloat(String(raw.ca125Uml ?? "").replace(",", "."));
  return {
    ageYears: Number.isFinite(ageYears) ? ageYears : undefined,
    oncologyCenter: raw.oncologyCenter === true || raw.oncologyCenter === "true",
    maxDiameterMm: Number.isFinite(maxDiameterMm) ? maxDiameterMm : undefined,
    maxSolidDiameterMm: Number.isFinite(maxSolidDiameterMm) ? maxSolidDiameterMm : undefined,
    moreThan10Locules: raw.moreThan10Locules === true || raw.moreThan10Locules === "true",
    papillaryCount: raw.papillaryCount as AdnexInput["papillaryCount"],
    acousticShadows: raw.acousticShadows === true || raw.acousticShadows === "true",
    ascites: raw.ascites === true || raw.ascites === "true",
    ca125Uml: useCa125 && Number.isFinite(ca125Raw) ? ca125Raw : undefined,
  };
}

function parseSimpleFeatures(raw: unknown): SimpleRulesFeature[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is SimpleRulesFeature => typeof x === "string");
}

export function renderIotaAdnexReport(payload: CalculatorReportPayload): GeneratedReport {
  const inputs = payload.inputs;
  const adnexPayload = parseAdnexInput(inputs.adnex ? (inputs.adnex as Record<string, unknown>) : inputs);
  const missingFields: string[] = [];

  const adnex = calculateAdnex(adnexPayload);
  const benign = parseSimpleFeatures(inputs.benignFeatures);
  const malignant = parseSimpleFeatures(inputs.malignantFeatures);
  const simple = evaluateSimpleRules({ benignFeatures: benign, malignantFeatures: malignant });
  const simpleVerdict =
    "errors" in simple ? "проверьте признаки Simple Rules" : simple.verdict;
  const srr = calculateSimpleRulesRisk({
    oncologyCenter: Boolean(adnexPayload.oncologyCenter),
    benignFeatures: benign,
    malignantFeatures: malignant,
  });
  const lr2 = calculateLr2({
    ageYears: adnexPayload.ageYears ?? 0,
    ascites: Boolean(adnexPayload.ascites),
    bloodFlowInSolidPapillary: Boolean(inputs.bloodFlowInSolidPapillary),
    maxSolidDiameterMm: adnexPayload.maxSolidDiameterMm ?? 0,
    irregularInternalWalls: Boolean(inputs.irregularInternalWalls),
    acousticShadows: Boolean(adnexPayload.acousticShadows),
  });

  const oradsCategory =
    typeof inputs.oradsCategory === "number"
      ? inputs.oradsCategory
      : typeof payload.category === "number"
        ? payload.category
        : null;

  const lines = [
    "---",
    "УЗ-исследование органов малого таза. IOTA — модель ADNEX / Simple Rules.",
    "ПРОТОКОЛ:",
    "",
    formatField("Возраст", adnexPayload.ageYears != null ? `${adnexPayload.ageYears} лет` : undefined, missingFields),
    formatField(
      "Наибольший диаметр образования",
      adnexPayload.maxDiameterMm != null ? `${adnexPayload.maxDiameterMm} мм` : undefined,
      missingFields,
    ),
    formatField(
      "Наибольший диаметр солидного компонента",
      adnexPayload.maxSolidDiameterMm != null ? `${adnexPayload.maxSolidDiameterMm} мм` : undefined,
      missingFields,
    ),
    formatField(">10 локул", adnexPayload.moreThan10Locules ? "да" : "нет", missingFields),
    formatField(
      "Папиллярные выступы (кол-во)",
      adnexPayload.papillaryCount != null ? String(adnexPayload.papillaryCount) : undefined,
      missingFields,
    ),
    formatField("Акустическая тень", adnexPayload.acousticShadows ? "да" : "нет", missingFields),
    formatField("Асцит", adnexPayload.ascites ? "да" : "нет", missingFields),
    formatField("CA-125 в модели", adnexPayload.ca125Uml != null ? `${adnexPayload.ca125Uml} МЕ/мл` : "не использован", missingFields),
    "",
  ];

  if ("errors" in adnex) {
    lines.push("Расчёт ADNEX: проверьте диапазоны полей (возраст 18–100, размеры в мм).");
  } else {
    lines.push(
      `МОДЕЛЬ ADNEX (${adnex.modelId}, ${adnex.modelVersion}):`,
      `• Доброкачественное: ${pct(adnex.probabilities.benign)}`,
      `• Пограничное: ${pct(adnex.probabilities.borderline)}`,
      `• Стадия I: ${pct(adnex.probabilities.stage1)}`,
      `• Стадия II–IV: ${pct(adnex.probabilities.stage2_4)}`,
      `• Метастатическое: ${pct(adnex.probabilities.metastatic)}`,
      "",
      `Суммарный риск злокачественности (ADNEX): ${pct(adnex.malignancyRisk)}`,
    );
  }

  lines.push(
    "",
    `IOTA Simple Rules: ${simpleVerdict}`,
    "malignancyRisk" in srr ? `Simple Rules Risk: ${pct(srr.malignancyRisk)}` : "",
    "malignancyRisk" in lr2 ? `LR2: ${pct(lr2.malignancyRisk)}` : "",
    oradsCategory != null ? `Сопоставление: O-RADS US ${oradsCategory} (введено врачом).` : `O-RADS US для сопоставления: ${MISSING_VALUE_RU}`,
    "",
    "ЗАКЛЮЧЕНИЕ:",
    "Результаты IOTA ADNEX / Simple Rules — assistive-стратификация риска. Тактика — по O-RADS US, клинике и локальному протоколу.",
    "",
    "ДИСКЛЕЙМЕР:",
    REPORT_GENERATOR_DISCLAIMER_RU,
    "---",
  );

  const filtered = lines.filter((l) => l !== "");
  const body = joinSections([{ lines: filtered }]);

  return {
    plainText: body,
    sections: [
      { id: "protocol", title: "ПРОТОКОЛ", body: filtered.slice(4, -4).join("\n") },
      {
        id: "conclusion",
        title: "ЗАКЛЮЧЕНИЕ",
        body:
          "errors" in adnex
            ? "Недостаточно данных для ADNEX."
            : `Риск ADNEX ${pct(adnex.malignancyRisk)} · Simple Rules ${simpleVerdict}`,
      },
    ],
    missingFields,
    disclaimer: REPORT_GENERATOR_DISCLAIMER_RU,
  };
}
