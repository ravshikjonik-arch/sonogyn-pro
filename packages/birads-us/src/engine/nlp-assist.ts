import type { BiradsInput } from "../birads-core";
import { defaultBiradsBrochureInput, type BiradsBrochureInput } from "../biradsBrochure2025";
import { mergeParsedBiradsInput } from "./merge-input";
import { generateStructuredReport } from "./structured-report";

export type NlpAssistResult = {
  parsedInput: BiradsBrochureInput;
  detectedKeywords: string[];
  suggestedDiagnosis: string;
  report: ReturnType<typeof generateStructuredReport>;
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
  { patterns: [/усилен/i, /enhancement/i], field: "posteriorFeatures", value: "enhancement", label: "усиление позади" },
  { patterns: [/тень/i, /shadow/i, /ослаблен/i], field: "posteriorFeatures", value: "shadowing", label: "акустическая тень" },
  { patterns: [/смешан/i, /mixed/i], field: "posteriorFeatures", value: "mixed", label: "смешанные эффекты" },
  { patterns: [/прост.*кист/i, /simple cyst/i], field: "specialCase", value: "simple_cyst", label: "простая киста" },
  { patterns: [/кист/i, /cyst/i], field: "specialCase", value: "simple_cyst", label: "киста" },
  { patterns: [/фиброаденом/i, /fibroadenoma/i], field: "specialCase", value: "none", label: "фиброадenoma" },
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
  { patterns: [/васкуляр/i, /кровоток/i, /doppler/i], field: "vascularity", value: "marked", label: "васкуляризация" },
  { patterns: [/умерен.*васкул|mild.*flow/i], field: "vascularity", value: "mild", label: "умеренная васкуляризация" },
  { patterns: [/без.*васкул|avascular/i], field: "vascularity", value: "none", label: "без васкуляризации" },
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

export function assistFromFreeText(text: string): NlpAssistResult {
  const { parsed, keywords } = parseBiradsFreeText(text);
  const input = mergeParsedBiradsInput(parsed);

  const report = generateStructuredReport(input);
  const topPath = report.engine.matchedPathologies[0];

  let suggestedDiagnosis = topPath?.nameRu ?? "Образование МЖ";
  if (/фиброаденома|fibroadenoma/i.test(text) || (input.shape === "oval" && input.margin === "circumscribed" && input.echoPattern === "hypoechoic")) {
    suggestedDiagnosis = "Наиболее вероятно фиброаденома";
  }
  if (input.echoPattern === "anechoic" && input.margin === "circumscribed") {
    suggestedDiagnosis = "Наиболее вероятно простая киста";
  }

  return {
    parsedInput: input,
    detectedKeywords: keywords,
    suggestedDiagnosis,
    report,
  };
}
