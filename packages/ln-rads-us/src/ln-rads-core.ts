import { categoryMeta, LN_RADS_VERSION } from "./knowledge/categories";
import { analyzeDoppler, dopplerScoreContribution } from "./engine/doppler";
import { analyzeSize, sizeScoreContribution } from "./engine/size-analysis";
import type { LnRadsCategory, LnRadsInput, LnRadsResult } from "./types";

function shapeScore(shape: LnRadsInput["shape"]): number {
  switch (shape) {
    case "oval":
      return 0;
    case "round":
      return 2;
    case "lobulated":
      return 2;
    case "irregular":
      return 3;
    case "spiculated":
      return 5;
  }
}

function capsuleScore(c: LnRadsInput["capsule"]): number {
  switch (c) {
    case "intact":
      return 0;
    case "thickened":
      return 1;
    case "interrupted":
      return 2;
    case "infiltrated":
      return 4;
  }
}

function hilumScore(h: LnRadsInput["hilum"]): number {
  switch (h) {
    case "preserved":
      return 0;
    case "compressed":
      return 1;
    case "displaced":
      return 2;
    case "absent":
      return 4;
  }
}

function cortexScore(c: LnRadsInput["cortex"]): number {
  switch (c) {
    case "thin":
      return 0;
    case "uniform_thickening":
      return 1;
    case "focal_thickening":
      return 2;
    case "eccentric_thickening":
      return 3;
    case "bulging":
      return 3;
  }
}

function echogenicityScore(e: LnRadsInput["echogenicity"]): number {
  switch (e) {
    case "normal":
      return 0;
    case "hypoechoic":
      return 1;
    case "markedly_hypoechoic":
      return 2;
    case "heterogeneous":
      return 2;
  }
}

function architectureScore(a: LnRadsInput["architecture"]): number {
  switch (a) {
    case "preserved":
      return 0;
    case "distorted":
      return 2;
    case "replaced":
      return 4;
  }
}

function advancedScore(input: LnRadsInput): { score: number; steps: string[] } {
  let score = 0;
  const steps: string[] = [];

  if (input.calcifications === "microcalcifications") {
    score += 3;
    steps.push("Микрокальцинаты: +3");
  } else if (input.calcifications === "coarse") {
    score += 1;
    steps.push("Грубые кальцинаты: +1");
  }

  if (input.necrosis === "partial") {
    score += 2;
    steps.push("Частичный некроз: +2");
  } else if (input.necrosis === "extensive") {
    score += 4;
    steps.push("Обширный некроз: +4");
  }

  if (input.cysticDegeneration === "present") {
    score += 2;
    steps.push("Кистозная дегенерация: +2");
  }

  if (input.extracapsularExtension === "suspected") {
    score += 3;
    steps.push("Подозрение на ECE: +3");
  } else if (input.extracapsularExtension === "definite") {
    score += 5;
    steps.push("Definite ECE: +5");
  }

  if (input.matting === "present") {
    score += 2;
    steps.push("Matting / конгломерат: +2");
  }

  if (input.elastography === "stiff") {
    score += 2;
    steps.push("Elastography stiff: +2");
  } else if (input.elastography === "intermediate") {
    score += 1;
    steps.push("Elastography intermediate: +1");
  }

  if (input.ceus === "heterogeneous") {
    score += 1;
    steps.push("CEUS heterogeneous: +1");
  } else if (input.ceus === "peripheral") {
    score += 2;
    steps.push("CEUS peripheral enhancement: +2");
  } else if (input.ceus === "non_enhancing_necrosis") {
    score += 3;
    steps.push("CEUS non-enhancing necrosis: +3");
  }

  if (input.cortexThicknessMm !== undefined && input.cortexThicknessMm > 3) {
    score += 1;
    steps.push(`Кора > 3 мм (${input.cortexThicknessMm}): +1`);
  }

  return { score, steps };
}

function mapCategory(score: number, input: LnRadsInput): LnRadsCategory {
  if (
    input.shape === "spiculated" ||
    input.extracapsularExtension === "definite" ||
    input.necrosis === "extensive" ||
    (input.hilum === "absent" && input.architecture === "replaced")
  ) {
    return 5;
  }

  if (score <= 1 && input.shape === "oval" && input.hilum === "preserved" && input.cortex === "thin") {
    return 1;
  }
  if (score <= 3) return 2;
  if (score <= 6) return 3;
  if (score <= 10) return 4;
  return 5;
}

function collectRedFlags(input: LnRadsInput, lsRatio: number | null): string[] {
  const flags: string[] = [];
  if (input.hilum === "absent") flags.push("Потеря эхогенного hilum");
  if (input.shape === "spiculated" || input.capsule === "infiltrated") flags.push("Spiculated/infiltrated margins");
  if (lsRatio !== null && lsRatio < 1.5) flags.push("Округлая форма (L/S < 1.5)");
  if (input.vascularity === "peripheral" || input.vascularity === "chaotic") flags.push("Abnormal Doppler pattern");
  if (input.calcifications === "microcalcifications") flags.push("Микрокальцинаты (корреляция с PTC)");
  if (input.necrosis !== "absent") flags.push("Некроз");
  if (input.extracapsularExtension !== "no") flags.push("Extracapsular extension");
  if (input.matting === "present") flags.push("Matting / conglomerate nodes");
  return flags;
}

function additionalImaging(input: LnRadsInput, category: LnRadsCategory): string[] {
  const rec: string[] = [];
  if (category >= 3) rec.push("CEUS при доступности");
  if (category >= 3 && input.elastography === "not_assessed") rec.push("Elastography (SWE/strain)");
  if (category >= 4) rec.push("PET-CT по онкопоказаниям");
  if (input.region.startsWith("level_") || input.region === "head_neck") {
    rec.push("Корреляция с ATA neck guidelines / primary thyroid nodule TI-RADS");
  }
  if (input.region === "axillary" || input.region === "internal_mammary") {
    rec.push("Корреляция с BI-RADS первичного образования МЖ");
  }
  return rec;
}

export function defaultLnRadsInput(): LnRadsInput {
  return {
    longAxisMm: 18,
    shortAxisMm: 7,
    cortexThicknessMm: 2,
    shape: "oval",
    capsule: "intact",
    hilum: "preserved",
    cortex: "thin",
    echogenicity: "normal",
    architecture: "preserved",
    vascularity: "hilar",
    calcifications: "none",
    necrosis: "absent",
    cysticDegeneration: "absent",
    extracapsularExtension: "no",
    matting: "absent",
    elastography: "not_assessed",
    ceus: "not_assessed",
    region: "head_neck",
    clinicalContext: "screening",
  };
}

export function evaluateLnRads(input: LnRadsInput): LnRadsResult {
  const steps: string[] = [];
  let score = 0;

  const sizeAnalysis = analyzeSize(input);
  const lsScore = sizeScoreContribution(sizeAnalysis.lsRatio);
  if (lsScore) steps.push(`L/S ${sizeAnalysis.lsRatio?.toFixed(2)}: +${lsScore}`);
  score += lsScore;

  const shapeS = shapeScore(input.shape);
  if (shapeS) steps.push(`Форма ${input.shape}: +${shapeS}`);
  score += shapeS;

  const capS = capsuleScore(input.capsule);
  if (capS) steps.push(`Кapsula ${input.capsule}: +${capS}`);
  score += capS;

  const hilS = hilumScore(input.hilum);
  if (hilS) steps.push(`Hilum ${input.hilum}: +${hilS}`);
  score += hilS;

  const corS = cortexScore(input.cortex);
  if (corS) steps.push(`Кора ${input.cortex}: +${corS}`);
  score += corS;

  const echoS = echogenicityScore(input.echogenicity);
  if (echoS) steps.push(`Эхогенность ${input.echogenicity}: +${echoS}`);
  score += echoS;

  const archS = architectureScore(input.architecture);
  if (archS) steps.push(`Архитектура ${input.architecture}: +${archS}`);
  score += archS;

  const dopS = dopplerScoreContribution(input.vascularity);
  if (dopS) steps.push(`ЦДК ${input.vascularity}: +${dopS}`);
  score += dopS;

  const adv = advancedScore(input);
  score += adv.score;
  steps.push(...adv.steps);

  const category = mapCategory(score, input);
  const meta = categoryMeta(category);
  const dopplerAnalysis = analyzeDoppler(input.vascularity);
  const redFlags = collectRedFlags(input, sizeAnalysis.lsRatio);

  return {
    category,
    score,
    malignancyRisk: meta.malignancyRisk,
    title: meta.definitionRu,
    decisionPath: steps.length ? steps : ["Существенных подозрительных признаков не выявлено."],
    sizeAnalysis,
    dopplerAnalysis,
    redFlags,
    biopsyRecommended: meta.biopsyRecommended,
    followUpRecommended: category <= 3,
    additionalImaging: additionalImaging(input, category),
    management: meta.managementRu,
  };
}

export { LN_RADS_VERSION };

export const lnRadsOptions = {
  shape: [
    { value: "oval", label: "Овальная" },
    { value: "round", label: "Округлая" },
    { value: "lobulated", label: "Lobulated" },
    { value: "spiculated", label: "Spiculated" },
    { value: "irregular", label: "Irregular" },
  ],
  capsule: [
    { value: "intact", label: "Intact" },
    { value: "thickened", label: "Thickened" },
    { value: "interrupted", label: "Interrupted" },
    { value: "infiltrated", label: "Infiltrated" },
  ],
  hilum: [
    { value: "preserved", label: "Preserved" },
    { value: "compressed", label: "Compressed" },
    { value: "displaced", label: "Displaced" },
    { value: "absent", label: "Absent" },
  ],
  cortex: [
    { value: "thin", label: "Thin" },
    { value: "uniform_thickening", label: "Uniform thickening" },
    { value: "focal_thickening", label: "Focal thickening" },
    { value: "eccentric_thickening", label: "Eccentric thickening" },
    { value: "bulging", label: "Bulging cortex" },
  ],
  echogenicity: [
    { value: "normal", label: "Normal" },
    { value: "hypoechoic", label: "Hypoechoic" },
    { value: "markedly_hypoechoic", label: "Markedly hypoechoic" },
    { value: "heterogeneous", label: "Heterogeneous" },
  ],
  architecture: [
    { value: "preserved", label: "Preserved" },
    { value: "distorted", label: "Distorted" },
    { value: "replaced", label: "Completely replaced" },
  ],
  region: [
    { value: "head_neck", label: "Head & Neck" },
    { value: "level_i", label: "Level I" },
    { value: "level_ii", label: "Level II" },
    { value: "level_iii", label: "Level III" },
    { value: "level_iv", label: "Level IV" },
    { value: "level_v", label: "Level V" },
    { value: "level_vi", label: "Level VI" },
    { value: "level_vii", label: "Level VII" },
    { value: "axillary", label: "Axillary" },
    { value: "internal_mammary", label: "Internal mammary" },
    { value: "supraclavicular", label: "Supraclavicular" },
    { value: "pelvic", label: "Pelvic" },
    { value: "external_iliac", label: "External iliac" },
    { value: "internal_iliac", label: "Internal iliac" },
    { value: "obturator", label: "Obturator" },
    { value: "common_iliac", label: "Common iliac" },
    { value: "paraaortic", label: "Paraaortic" },
    { value: "inguinal", label: "Inguinal" },
  ],
} as const;
