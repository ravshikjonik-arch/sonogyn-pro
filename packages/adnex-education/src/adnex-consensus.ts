import type { IotaSimpleCode, IotaSimpleVerdict } from "./types";
import {
  ORADS_US_SOLID_COMPONENT_MIN_MM,
  ORADS_US_VERSION,
  buildSupplementaryReadingBlock,
  oradsEchogramsLibraryHref,
  oradsManagementForCategory,
} from "./orads-protocol";
import { evaluateIotaSimpleRules } from "./ozerskaya-iota";

/** Минимальный срез полей калькулятора O-RADS (без зависимости от mobile). */
export type AdnexCalcInput = {
  localization?: "ovarian" | "extraovarian";
  menopause?: "pre" | "post";
  lesionKind?: "physiological" | "nonphysiological";
  structure?: "unilocular" | "multilocular" | "solid";
  unilocularSubtype?: string;
  septaThickness?: "thin" | "thick";
  solidComponent?: boolean;
  solidType?: "smooth" | "irregular" | "papillary";
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  ascites?: boolean;
  bloodFlow?: "none" | "minimal" | "moderate" | "marked";
  papillaryProjectionCount?: "0" | "1" | "2" | "3" | "4plus";
  largestSolidDiameterMm?: number;
  acousticShadows?: boolean;
  iotaColorScore?: "1" | "2" | "3" | "4";
  /** O-RADS US: неполная перегородка во 2-й плоскости → однокамерное. */
  incompleteSeptum?: boolean;
};

export type OradsProtocolPitfall = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  atlasPageId?: string;
  atlasHref?: string;
};

/** @deprecated используйте OradsProtocolPitfall */
export type OzerskayaGuardrail = OradsProtocolPitfall;

export type AdnexTriangulationAgreement = "full" | "partial" | "conflict";

export type AdnexTriangulation = {
  oradsCategory: number;
  iotaVerdict: IotaSimpleVerdict;
  iotaBenign: IotaSimpleCode[];
  iotaMalignant: IotaSimpleCode[];
  agreement: AdnexTriangulationAgreement;
  headline: string;
  pitfalls: OradsProtocolPitfall[];
  /** @deprecated используйте pitfalls */
  guardrails: OradsProtocolPitfall[];
  suggestedStructure?: "unilocular" | "multilocular";
  suggestedOradsNote?: string;
  protocolSnippet: string;
  managementRu: string;
};

function maxMm(input: AdnexCalcInput): number {
  return Math.max(input.lengthMm ?? 0, input.widthMm ?? 0, input.heightMm ?? 0);
}

function effectiveStructure(input: AdnexCalcInput): AdnexCalcInput["structure"] {
  if (input.incompleteSeptum && input.structure === "multilocular" && !input.solidComponent) {
    return "unilocular";
  }
  return input.structure;
}

/** Авто-маппинг признаков формы → IOTA Simple Rules (IOTA group). */
export function deriveIotaCodesFromInput(input: AdnexCalcInput): {
  benign: IotaSimpleCode[];
  malignant: IotaSimpleCode[];
} {
  const benign: IotaSimpleCode[] = [];
  const malignant: IotaSimpleCode[] = [];
  const structure = effectiveStructure(input);
  const max = maxMm(input);
  const solidMm = input.largestSolidDiameterMm ?? 0;

  if (structure === "unilocular") benign.push("B1");
  if (!input.solidComponent || solidMm < 7) benign.push("B2");
  if (input.acousticShadows) benign.push("B3");
  if (max > 0 && max < 100) benign.push("B5");
  if (input.bloodFlow === "none" || input.iotaColorScore === "1") benign.push("B6");

  if (input.solidType === "irregular" || (structure === "solid" && input.solidType !== "smooth")) {
    malignant.push("M1");
  }
  if (input.ascites) malignant.push("M2");
  if (input.papillaryProjectionCount === "4plus") malignant.push("M3");
  if (
    structure === "multilocular" &&
    input.solidComponent &&
    max >= 100 &&
    input.solidType === "irregular"
  ) {
    malignant.push("M4");
  }
  if (input.iotaColorScore === "4" || input.bloodFlow === "marked") malignant.push("M5");

  return { benign, malignant };
}

export function evaluateOradsProtocolPitfalls(input: AdnexCalcInput): OradsProtocolPitfall[] {
  const out: OradsProtocolPitfall[] = [];
  const max = maxMm(input);
  const solidMm = input.largestSolidDiameterMm ?? 0;

  if (input.incompleteSeptum && input.structure === "multilocular") {
    out.push({
      id: "incomplete_septum",
      severity: "critical",
      title: "Неполная перегородка (O-RADS US)",
      message:
        "Перегородка не видна во 2-й плоскости → образование однокамерное. Не завышайте O-RADS из-за ложной многокамерности.",
      atlasPageId: "ozerskaya-p06",
      atlasHref: oradsEchogramsLibraryHref({ page: "ozerskaya-p06" }),
    });
  }

  if (input.solidComponent && solidMm > 0 && solidMm < ORADS_US_SOLID_COMPONENT_MIN_MM) {
    out.push({
      id: "solid_below_3mm",
      severity: "warning",
      title: "Солидный компонент <3 мм",
      message: `По O-RADS US v2022 солидным считается ≥${ORADS_US_SOLID_COMPONENT_MIN_MM} мм. Пересмотрите отметку «есть солидный компонент».`,
      atlasPageId: "ozerskaya-p23",
      atlasHref: oradsEchogramsLibraryHref({ page: "ozerskaya-p23" }),
    });
  }

  if (input.papillaryProjectionCount === "3") {
    out.push({
      id: "papillary_three_not_m3",
      severity: "info",
      title: "3 папиллярные проекции",
      message:
        "IOTA M3 — при ≥4 папиллярных разрастаниях. Три ПП учитываются в O-RADS US, но не равны M3 автоматически.",
      atlasPageId: "ozerskaya-p16",
      atlasHref: oradsEchogramsLibraryHref({ chapter: "iota" }),
    });
  }

  if (input.menopause === "post" && input.unilocularSubtype === "simple_cyst" && max > 50) {
    out.push({
      id: "postmeno_simple_cyst",
      severity: "warning",
      title: "Простая киста в постменопаузе >5 см",
      message: "По O-RADS US — минимум O-RADS 3. Контроль/МРТ по протоколу центра.",
    });
  }

  if (input.unilocularSubtype === "hemorrhagic" && input.septaThickness === "thick") {
    out.push({
      id: "hemorrhagic_vs_septa",
      severity: "info",
      title: "Геморрагическая vs перегородки",
      message:
        "Ретикулярный рисунок геморрагической кисты не путать с септами (O-RADS US / IOTA morphology).",
      atlasPageId: "ozerskaya-p24",
      atlasHref: oradsEchogramsLibraryHref({ page: "ozerskaya-p24" }),
    });
  }

  return out;
}

/** @deprecated используйте evaluateOradsProtocolPitfalls */
export const evaluateOzerskayaGuardrails = evaluateOradsProtocolPitfalls;

function impliedOradsBand(verdict: IotaSimpleVerdict): number {
  if (verdict === "benign") return 2;
  if (verdict === "malignant") return 4;
  return 3;
}

function assessAgreement(
  oradsCategory: number,
  iotaVerdict: IotaSimpleVerdict,
  pitfalls: OradsProtocolPitfall[],
): AdnexTriangulationAgreement {
  const hasCritical = pitfalls.some((g) => g.severity === "critical");
  const implied = impliedOradsBand(iotaVerdict);

  if (hasCritical) return "partial";

  if (iotaVerdict === "benign" && oradsCategory >= 4) return "conflict";
  if (iotaVerdict === "malignant" && oradsCategory <= 2) return "conflict";

  if (Math.abs(oradsCategory - implied) <= 1) return "full";
  return "partial";
}

function buildHeadline(agreement: AdnexTriangulationAgreement, orads: number, verdict: IotaSimpleVerdict): string {
  if (agreement === "full") {
    return `O-RADS ${orads} и IOTA Simple Rules согласованы.`;
  }
  if (agreement === "conflict") {
    return `Расхождение: O-RADS ${orads} vs IOTA — перепроверьте плоскости, солид ≥3 мм и перегородки.`;
  }
  return `Частичное согласование O-RADS и IOTA — уточните признаки по ${ORADS_US_VERSION}.`;
}

function buildProtocolSnippet(
  input: AdnexCalcInput,
  oradsCategory: number,
  iotaSummary: string,
  pitfalls: OradsProtocolPitfall[],
): string {
  const structure = effectiveStructure(input);
  const max = maxMm(input);
  const side = input.localization === "extraovarian" ? "экстраовариально" : "яичник/придаток";
  const lines = [
    `УЗ-придатки (${side}):`,
    structure ? `структура — ${structure}` : null,
    max > 0 ? `наибольший размер ${max} мм` : null,
    input.solidComponent
      ? `солидный компонент ${input.largestSolidDiameterMm ?? "—"} мм`
      : "без солидного компонента",
    input.ascites ? "асцит +" : null,
    `O-RADS US: ${oradsCategory} (${ORADS_US_VERSION}).`,
    `IOTA Simple Rules: ${iotaSummary}`,
  ].filter(Boolean);

  if (pitfalls.length) {
    lines.push(`Уточнения по протоколу: ${pitfalls.map((g) => g.title).join("; ")}.`);
  }

  lines.push("Интерпретация — врачом УЗ-диагностики; не является гистологическим диагнозом.");
  return lines.join(" ");
}

export function evaluateAdnexTriangulation(
  input: AdnexCalcInput,
  oradsCategory: number,
): AdnexTriangulation {
  const { benign, malignant } = deriveIotaCodesFromInput(input);
  const iota = evaluateIotaSimpleRules(benign, malignant);
  const pitfalls = evaluateOradsProtocolPitfalls(input);
  const agreement = assessAgreement(oradsCategory, iota.verdict, pitfalls);

  let suggestedStructure: AdnexTriangulation["suggestedStructure"];
  let suggestedOradsNote: string | undefined;
  if (input.incompleteSeptum && input.structure === "multilocular" && !input.solidComponent) {
    suggestedStructure = "unilocular";
    suggestedOradsNote =
      "При переклассификации в однокамерное по O-RADS US категория может быть ниже — пересчитайте.";
  }

  const cat = Math.min(5, Math.max(1, oradsCategory)) as 1 | 2 | 3 | 4 | 5;

  return {
    oradsCategory: cat,
    iotaVerdict: iota.verdict,
    iotaBenign: iota.benignMatched,
    iotaMalignant: iota.malignantMatched,
    agreement,
    headline: buildHeadline(agreement, cat, iota.verdict),
    pitfalls,
    guardrails: pitfalls,
    suggestedStructure,
    suggestedOradsNote,
    protocolSnippet: buildProtocolSnippet(input, cat, iota.summaryRu, pitfalls),
    managementRu: oradsManagementForCategory(cat),
  };
}

export function buildAdnexTriangulationReport(tri: AdnexTriangulation): string {
  return [
    `=== O-RADS US · перекрёстная проверка (${ORADS_US_VERSION}) ===`,
    tri.headline,
    `O-RADS US: ${tri.oradsCategory}`,
    `IOTA Simple Rules: ${tri.iotaVerdict} (B: ${tri.iotaBenign.join(", ") || "—"}; M: ${tri.iotaMalignant.join(", ") || "—"})`,
    tri.pitfalls.length
      ? `Уточнения: ${tri.pitfalls.map((g) => `${g.title} — ${g.message}`).join(" | ")}`
      : null,
    tri.suggestedOradsNote,
    `Тактика (O-RADS US): ${tri.managementRu}`,
    "",
    tri.protocolSnippet,
    "",
    buildSupplementaryReadingBlock(),
  ]
    .filter(Boolean)
    .join("\n");
}
