import type { BiradsInput } from "../birads-core";
import { defaultBiradsBrochureInput, type BiradsBrochureInput } from "../biradsBrochure2025";
import { mergeParsedBiradsInput } from "./merge-input";
import { generateStructuredReport } from "./structured-report";

export type NlpAssistResult = {
  parsedInput: BiradsBrochureInput;
  detectedKeywords: string[];
  /** Neutral assist note (kept under the old name for callers). Never a diagnosis. */
  suggestedDiagnosis: string;
  /** Descriptor groups not found in the text: the calculator shows defaults there until the doctor confirms. */
  missingFeatures: string[];
  report: ReturnType<typeof generateStructuredReport>;
};

const REQUIRED_FEATURES_RU: Record<"shape" | "orientation" | "margin" | "echoPattern" | "posteriorFeatures", string> = {
  shape: "форма",
  orientation: "ориентация",
  margin: "контур",
  echoPattern: "эхоструктура",
  posteriorFeatures: "задние акустические признаки",
};

type KeywordRule = {
  patterns: RegExp[];
  field: keyof BiradsInput | keyof BiradsBrochureInput;
  value: string;
  label: string;
};

const KEYWORD_RULES: KeywordRule[] = [
  { patterns: [/овальн/i, /oval/i], field: "shape", value: "oval", label: "овальная форма" },
  { patterns: [/кругл/i, /round/i], field: "shape", value: "round", label: "круглая форма" },
  { patterns: [/дольчат/i, /lobulat/i], field: "shape", value: "lobulated", label: "дольчатая форма" },
  { patterns: [/неправильн/i, /irregular/i], field: "shape", value: "irregular", label: "неправильная форма" },
  { patterns: [/параллельн/i, /parallel/i], field: "orientation", value: "parallel", label: "параллельная" },
  { patterns: [/непараллельн/i, /non-?parallel/i, /вертикальн/i], field: "orientation", value: "non_parallel", label: "непараллельная" },
  { patterns: [/ч[её]тк/i, /ровн/i, /circumscribed/i], field: "margin", value: "circumscribed", label: "чёткие контуры" },
  { patterns: [/неч[её]тк/i, /indistinct/i], field: "margin", value: "indistinct", label: "нечёткие контуры" },
  { patterns: [/угловат/i, /angular/i], field: "margin", value: "angular", label: "угловатые контуры" },
  { patterns: [/микродольч/i, /microlobul/i], field: "margin", value: "microlobulated", label: "микродольчатые" },
  { patterns: [/спикул/i, /spicul/i], field: "margin", value: "spiculated", label: "спикулярные" },
  { patterns: [/анэхоген/i, /anechoic/i], field: "echoPattern", value: "anechoic", label: "анэхогенное" },
  { patterns: [/гипоэхоген/i, /hypoechoic/i], field: "echoPattern", value: "hypoechoic", label: "гипоэхогенное" },
  { patterns: [/изоэхоген/i, /isoechoic/i], field: "echoPattern", value: "isoechoic", label: "изоэхогенное" },
  { patterns: [/гиперэхоген/i, /hyperechoic/i], field: "echoPattern", value: "hyperechoic", label: "гиперэхогенное" },
  { patterns: [/гетероген/i, /heterogen/i, /неоднород/i], field: "echoPattern", value: "heterogeneous", label: "гетерогенное" },
  { patterns: [/(усилени[ея]|усилен[а-я]*)\s+(сзади|позади|дорсальн)/i, /дорсальн[а-я]*\s+усилени/i, /posterior enhancement/i], field: "posteriorFeatures", value: "enhancement", label: "усиление позади" },
  { patterns: [/тень/i, /shadow/i, /ослаблен/i], field: "posteriorFeatures", value: "shadowing", label: "акустическая тень" },
  { patterns: [/смешан/i, /mixed/i], field: "posteriorFeatures", value: "mixed", label: "смешанные эффекты" },
  { patterns: [/прост[а-я]*\s+кист/i, /simple cyst/i], field: "specialCase", value: "simple_cyst", label: "простая киста" },
  { patterns: [/макрокальц/i, /macrocalc/i], field: "calcifications", value: "macro", label: "макрокальцификаты" },
  { patterns: [/микрокальц/i, /microcalc/i], field: "calcifications", value: "micro_in_lesion", label: "микрокальцификаты" },
  { patterns: [/внутрипротоков/i, /intraductal/i], field: "calcifications", value: "intraductal_outside", label: "внутрипротоковые" },
  { patterns: [/архитектон/i, /distortion/i], field: "associatedFeatures", value: "architectural_distortion", label: "нарушение архитектоники" },
  { patterns: [/от[её]к/i, /edema/i], field: "associatedFeatures", value: "edema", label: "отёк" },
  { patterns: [/утолщен.*кож/i, /skin thick/i], field: "associatedFeatures", value: "skin_thickening", label: "утолщение кожи" },
  { patterns: [/минимальн.*gtc|gtc.*<25/i], field: "gtcAmount", value: "minimal", label: "GTC минимальная" },
  { patterns: [/умеренн.*gtc|gtc.*50/i], field: "gtcAmount", value: "moderate", label: "GTC умеренная" },
  { patterns: [/выражен.*gtc|gtc.*>75/i], field: "gtcAmount", value: "pronounced", label: "GTC выраженная" },
  { patterns: [/подмышеч/i, /axill/i], field: "lymphNodeSites", value: "axilla_I", label: "подмышечные ЛУ" },
  { patterns: [/выражен[а-я]*\s+(васкул|кровоток)|гиперваскуляр|усилен[а-я]*\s+кровоток|marked (flow|vascular)/i], field: "vascularity", value: "marked", label: "выраженная васкуляризация" },
  { patterns: [/умерен[а-я]*\s+(васкул|кровоток)|mild.*flow/i], field: "vascularity", value: "mild", label: "умеренная васкуляризация" },
  { patterns: [/без\s+(васкул|кровоток)|аваскуляр|avascular|кровоток\s+не\s+(определя|регистрир|выявля)/i], field: "vascularity", value: "none", label: "без васкуляризации" },
];

export function parseBiradsFreeText(text: string): { parsed: Partial<BiradsBrochureInput>; keywords: string[] } {
  const parsed: Partial<BiradsBrochureInput> = {
    findingType: "mass",
    associatedFeatures: [],
    lymphNodeSites: [],
  };
  const keywords: string[] = [];

  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      keywords.push(rule.label);
      if (rule.field === "associatedFeatures") {
        const list = parsed.associatedFeatures ?? [];
        if (!list.includes(rule.value)) parsed.associatedFeatures = [...list, rule.value];
      } else if (rule.field === "lymphNodeSites") {
        const list = parsed.lymphNodeSites ?? [];
        if (!list.includes(rule.value)) parsed.lymphNodeSites = [...list, rule.value];
      } else {
        (parsed as Record<string, unknown>)[rule.field] = rule.value;
      }
    }
  }

  const sizeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*[×x*]\s*(\d+(?:[.,]\d+)?)\s*мм/i);
  if (sizeMatch) {
    keywords.push(`размер ${sizeMatch[1]}×${sizeMatch[2]} мм`);
    parsed.localizationText = `Образование ${sizeMatch[1]}×${sizeMatch[2]} мм`;
  }

  return { parsed, keywords };
}

/** Diagnosis words are noted but never turned into descriptors: the category comes only from described features. */
const DIAGNOSIS_MENTIONS: { test: (text: string) => boolean; label: string }[] = [
  { test: (t) => /фиброаденом|fibroadenoma/i.test(t), label: "в тексте упомянута фиброаденома — на расчёт не влияет" },
  {
    test: (t) => /кист|cyst/i.test(t) && !/прост[а-я]*\s+кист|simple cyst/i.test(t),
    label: "в тексте упомянута киста — уточните тип (простая / осложнённая / микрокисты)",
  },
  { test: (t) => /(^|[^а-яё])рак([^а-яё]|$)|карцином|carcinoma/i.test(t), label: "в тексте упомянут диагноз — на расчёт не влияет" },
];

function missingFeatureGroups(parsed: Partial<BiradsBrochureInput>): string[] {
  if (parsed.specialCase === "simple_cyst") return [];
  return (Object.keys(REQUIRED_FEATURES_RU) as (keyof typeof REQUIRED_FEATURES_RU)[])
    .filter((k) => parsed[k] === undefined)
    .map((k) => REQUIRED_FEATURES_RU[k]);
}

export function assistFromFreeText(text: string): NlpAssistResult {
  const { parsed, keywords } = parseBiradsFreeText(text);
  for (const m of DIAGNOSIS_MENTIONS) if (m.test(text)) keywords.push(m.label);
  const input = mergeParsedBiradsInput(parsed);
  const report = generateStructuredReport(input);
  const missingFeatures = missingFeatureGroups(parsed);
  const suggestedDiagnosis = missingFeatures.length
    ? `Признаки из текста перенесены в калькулятор. Не распознаны: ${missingFeatures.join(", ")} — укажите их вручную. Категорию определяет врач по лексикону ACR, не AI.`
    : "Признаки из текста перенесены в калькулятор — проверьте и подтвердите. Категорию определяет врач по лексикону ACR, не AI.";
  return { parsedInput: input, detectedKeywords: keywords, suggestedDiagnosis, missingFeatures, report };
}
