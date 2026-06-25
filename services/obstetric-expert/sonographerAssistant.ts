import { findPathologyById, getAllPathologies, searchPathologies, type WoodwardPathologyEntry } from "../../medical-knowledge/index";

import { buildProtocolChecklist } from "./protocolChecklists";
import { buildDifferentialDiagnosis } from "./differentialEngine";
import { collectAllTokens, normalizeFindings } from "./findingSynonyms";
import type {
  BiometricData,
  DifferentialInput,
  DifferentialOutput,
  DopplerData,
  FindingToken,
  GestationalAgeInput,
} from "./types";

export type SonographerContext = {
  gestationalAge?: GestationalAgeInput;
  biometricData?: BiometricData;
  dopplerData?: DopplerData | DopplerData[];
};

export type FindingAnalysis = {
  finding: string;
  tokens: FindingToken[];
  explanation: string;
  clinicalSignificance: string;
  relatedPathologies: {
    id: string;
    name: string;
    bookPage?: number;
    relevance: "primary" | "differential" | "associated";
  }[];
  redFlags: string[];
  documentationTips: string[];
};

export type MeasurementSuggestion = {
  parameter: string;
  parameterRu: string;
  unit: string;
  rationale: string;
  referenceNote?: string;
  priority: "required" | "recommended" | "conditional";
};

export type ViewSuggestion = {
  view: string;
  plane?: string;
  rationale: string;
  linkedFinding?: string;
  priority: "required" | "recommended";
};

export type ReportFormat = "brief" | "detailed" | "recommendations";

export type GeneratedReport = {
  format: ReportFormat;
  gestationalAgeLabel: string;
  briefConclusion: string;
  detailedConclusion: string;
  recommendations: string[];
  isuogDisclaimer: string;
  /** ISUOG-style structured blocks */
  sections: {
    indication?: string;
    technique?: string;
    findings: string[];
    biometry?: string[];
    doppler?: string[];
    impression: string;
    recommendations: string[];
  };
};

const ISUOG_DISCLAIMER =
  "Заключение составлено по данным УЗ-исследования и не является окончательным диагнозом. " +
  "Интерпретация — лечащий врач. Классификации и пороги — по ISUOG / локальному протоколу и КР.";

function formatGa(ga?: GestationalAgeInput): string {
  if (!ga?.weeks) return "срок не указан";
  return ga.days ? `${ga.weeks}+${ga.days} нед` : `${ga.weeks} нед`;
}

function pathologyRelevance(entry: WoodwardPathologyEntry, tokens: FindingToken[]): number {
  const corpus = [
    entry.definition,
    ...entry.ultrasound_findings,
    ...entry.differential_diagnosis,
  ]
    .join(" ")
    .toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (corpus.includes(t.replace(/_/g, " "))) score += 2;
  }
  if (tokens.some((t) => entry.id.includes(t.replace(/_/g, "-")))) score += 3;
  return score;
}

function stripMeasurements(text: string): string {
  return text.replace(/\d+([.,]\d+)?\s*(mm|см|cm|г|g|%)/gi, " ").replace(/\s+/g, " ").trim();
}

/**
 * Объяснить одну находку в контексте Woodward knowledge base.
 */
export function analyzeFinding(finding: string, context: SonographerContext = {}): FindingAnalysis {
  const tokens = collectAllTokens(
    [finding],
    context.biometricData,
    context.dopplerData,
  );

  const textQuery = stripMeasurements(finding);
  const textHits = textQuery ? searchPathologies(textQuery, 8) : [];

  const merged = new Map<string, { entry: WoodwardPathologyEntry; score: number }>();
  for (const entry of textHits) {
    merged.set(entry.id, { entry, score: pathologyRelevance(entry, tokens) + 1 });
  }
  for (const entry of getAllPathologies()) {
    const score = pathologyRelevance(entry, tokens);
    if (score <= 0) continue;
    const prev = merged.get(entry.id);
    merged.set(entry.id, { entry, score: Math.max(prev?.score ?? 0, score) });
  }

  const scored = [...merged.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const primary = scored[0]?.entry;
  const explanation = primary
    ? `${finding}: по Woodward (${primary.name}, p.${primary.bookPage}) — ${primary.definition.slice(0, 280)}`
    : `${finding}: находка зафиксирована; уточните контекст (срок, дополнительные срезы).`;

  const clinicalSignificance =
    primary?.red_flags.join(" ") ||
    primary?.follow_up.slice(0, 2).join(" ") ||
    "Требуется корреляция с клиникой и при необходимости МРТ/генетика.";

  const relatedPathologies = scored.map(({ entry, score }, i) => ({
    id: entry.id,
    name: entry.name,
    bookPage: entry.bookPage,
    relevance: (i === 0 ? "primary" : score > 2 ? "differential" : "associated") as
      | "primary"
      | "differential"
      | "associated",
  }));

  const redFlags = [
    ...new Set(scored.flatMap(({ entry }) => entry.red_flags).filter(Boolean)),
  ].slice(0, 5);

  const documentationTips = [
    ...new Set(
      scored.flatMap(({ entry }) => entry.ultrasound_findings).filter((u) => u.length > 20),
    ),
  ].slice(0, 4);

  return {
    finding,
    tokens,
    explanation,
    clinicalSignificance,
    relatedPathologies,
    redFlags,
    documentationTips,
  };
}

/** Дифференциальный диагноз (обёртка Этапа 2). */
export function generateDifferential(input: DifferentialInput): DifferentialOutput {
  return buildDifferentialDiagnosis(input);
}

/**
 * Предложить измерения по сроку и находкам.
 */
export function suggestMeasurements(
  context: SonographerContext,
  findings: string[] = [],
): MeasurementSuggestion[] {
  const weeks = context.gestationalAge?.weeks;
  const tokens = collectAllTokens(findings, context.biometricData, context.dopplerData);
  const out: MeasurementSuggestion[] = [];

  const add = (s: MeasurementSuggestion) => {
    if (!out.some((x) => x.parameter === s.parameter)) out.push(s);
  };

  if (weeks == null || weeks < 14) {
    add({
      parameter: "CRL",
      parameterRu: "КТР",
      unit: "mm",
      rationale: "I триместр — dating + viability",
      priority: "required",
    });
    add({
      parameter: "NT",
      parameterRu: "Толщина воротникового пространства",
      unit: "mm",
      rationale: "Скрининг 11–13+6 (FMF)",
      referenceNote: "Median по GA; MoM в риск-модели",
      priority: "required",
    });
    add({
      parameter: "DV_PI",
      parameterRu: "DV PI",
      unit: "—",
      rationale: "Скрининг анеуплоидий / сердечная функция",
      priority: "recommended",
    });
  }

  if (weeks != null && weeks >= 14) {
    for (const p of [
      { parameter: "BPD", parameterRu: "BPD", unit: "mm" },
      { parameter: "HC", parameterRu: "HC", unit: "mm" },
      { parameter: "AC", parameterRu: "AC", unit: "mm" },
      { parameter: "FL", parameterRu: "FL", unit: "mm" },
    ]) {
      add({
        ...p,
        rationale: "Стандартная фетометрия II–III триместра (ISUOG)",
        priority: weeks >= 18 && weeks <= 22 ? "required" : "recommended",
      });
    }
    add({
      parameter: "EFW",
      parameterRu: "Расчётная масса плода (EFW)",
      unit: "g",
      rationale: "Hadlock / INTERGROWTH — percentile",
      priority: "recommended",
    });
  }

  if (tokens.includes("ventriculomegaly") || context.biometricData?.lateralVentricleMm != null) {
    add({
      parameter: "LV_ATRIUM",
      parameterRu: "Ширина атриума бокового ventricle",
      unit: "mm",
      rationale: "Вентрикуломегалия: порог ~10 mm (ISUOG); 13 mm — умеренная",
      referenceNote: context.biometricData?.lateralVentricleMm
        ? `Зафиксировано: ${context.biometricData.lateralVentricleMm} mm`
        : undefined,
      priority: "required",
    });
  }

  if (tokens.includes("absent_csp") || tokens.includes("agenesis_cc")) {
    add({
      parameter: "HC",
      parameterRu: "HC (динамика)",
      unit: "mm",
      rationale: "Midline anomaly — microcephaly risk",
      priority: "required",
    });
  }

  if (tokens.includes("hydronephrosis")) {
    add({
      parameter: "AP_RENAL_PELVIS",
      parameterRu: "AP диаметр лоханки",
      unit: "mm",
      rationale: "Градация pyelectasis / hydronephrosis",
      priority: "required",
    });
  }

  if (tokens.includes("increased_nt")) {
    add({
      parameter: "NB",
      parameterRu: "Носовая кость",
      unit: "mm",
      rationale: "Маркер анеуплоидии I триместра",
      priority: "required",
    });
  }

  return out;
}

/**
 * Дополнительные срезы / projections по находкам и дифференциалу.
 */
export function suggestAdditionalViews(
  context: SonographerContext,
  findings: string[] = [],
  differential?: DifferentialOutput,
): ViewSuggestion[] {
  const tokens = collectAllTokens(findings, context.biometricData, context.dopplerData);
  const views: ViewSuggestion[] = [];
  const push = (v: ViewSuggestion) => {
    if (!views.some((x) => x.view === v.view)) views.push(v);
  };

  const checklist = buildProtocolChecklist(context.gestationalAge?.weeks, tokens);
  for (const v of checklist.visualize.slice(0, 6)) {
    push({ view: v, rationale: checklist.labelRu, priority: "recommended" });
  }

  if (tokens.includes("ventriculomegaly") || tokens.includes("absent_csp")) {
    push({
      view: "Brain transventricular",
      plane: "axial",
      rationale: "Atrial width, CSP",
      linkedFinding: "ventriculomegaly/CSP",
      priority: "required",
    });
    push({
      view: "Brain coronal — frontal horns",
      plane: "coronal",
      rationale: "Texas longhorn vs flat-top (ACC vs SOD)",
      priority: "required",
    });
    push({
      view: "Brain midsagittal",
      plane: "sagittal",
      rationale: "Corpus callosum, CSP, vermis",
      priority: "required",
    });
    push({
      view: "Transthalamic / transcerebellar",
      plane: "axial",
      rationale: "Posterior fossa, CM",
      priority: "recommended",
    });
  }

  if (differential?.some((d) => d.pathologyId.includes("holoprosencephaly"))) {
    push({
      view: "Facial profile + orbits",
      rationale: "HPE spectrum — facial anomalies",
      priority: "required",
    });
  }

  if (tokens.includes("cdh")) {
    push({ view: "Four-chamber + stomach position", rationale: "CDH", priority: "required" });
    push({ view: "Lung 4-quadrant survey", rationale: "LHR context", priority: "recommended" });
  }

  if (tokens.includes("hydronephrosis")) {
    push({ view: "Kidneys coronal both sides", rationale: "AP pelvis", priority: "required" });
    push({ view: "Bladder + umbilical arteries", rationale: "Empty bladder — PUV", priority: "required" });
  }

  const topDx = differential?.[0];
  if (topDx) {
    const entry = findPathologyById(topDx.pathologyId);
    for (const u of entry?.ultrasound_findings.slice(0, 2) ?? []) {
      if (/plane|sagittal|coronal|axial|3D/i.test(u)) {
        push({ view: u.slice(0, 120), rationale: `Woodward p.${entry?.bookPage}`, priority: "recommended" });
      }
    }
  }

  return views;
}

export type ReportInput = DifferentialInput & {
  indication?: string;
  technique?: string;
};

/**
 * ISUOG-compliant structured report (brief / detailed / recommendations).
 */
export function generateReport(
  input: ReportInput,
  format: ReportFormat = "detailed",
): GeneratedReport {
  const gaLabel = formatGa(input.gestationalAge);
  const tokens = collectAllTokens(input.findings, input.biometricData, input.dopplerData);
  const differential = buildDifferentialDiagnosis(input);
  const top = differential[0];
  const analyses = input.findings.map((f) => analyzeFinding(f, input));

  const findingLines = input.findings.map((f, i) => {
    const a = analyses[i];
    return `• ${f} — ${a.clinicalSignificance.slice(0, 160)}`;
  });

  const dxLines = differential.slice(0, 4).map(
    (d) => `• ${d.diagnosis} (${Math.round(d.confidence * 100)}%)`,
  );

  const recs = [
    ...new Set(differential.flatMap((d) => d.nextSteps)),
    ...suggestMeasurements(input, input.findings)
      .filter((m) => m.priority === "required")
      .map((m) => `Доизмерить: ${m.parameterRu}`),
    ...suggestAdditionalViews(input, input.findings, differential)
      .filter((v) => v.priority === "required")
      .map((v) => `Доп. срез: ${v.view}`),
  ].slice(0, 10);

  const briefConclusion = top
    ? `При ${gaLabel}: ${input.findings.join("; ")}. Ведущий дифференциал: ${top.diagnosis} (${Math.round(top.confidence * 100)}%).`
    : `При ${gaLabel}: ${input.findings.join("; ")}. Дифференциал уточняется.`;

  const detailedConclusion = [
    `Срок: ${gaLabel}.`,
    "Находки:",
    ...findingLines,
    "",
    "Дифференциальный ряд:",
    ...(dxLines.length ? dxLines : ["• Недостаточно данных — расширить протокол"]),
    "",
    top?.missingFindings.length
      ? `Не подтверждено: ${top.missingFindings.join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const biometryLines: string[] = [];
  const b = input.biometricData;
  if (b?.lateralVentricleMm != null) biometryLines.push(`Atrium: ${b.lateralVentricleMm} mm`);
  if (b?.bpdMm) biometryLines.push(`BPD: ${b.bpdMm} mm`);
  if (b?.hcMm) biometryLines.push(`HC: ${b.hcMm} mm`);

  const sections = {
    indication: input.indication ?? "Пrenatal ultrasound — expert assist (Woodward / ISUOG)",
    technique: input.technique ?? "Transabdominal/transvaginal per GA; stored cine loops recommended",
    findings: findingLines,
    biometry: biometryLines.length ? biometryLines : undefined,
    doppler: undefined as string[] | undefined,
    impression: top ? `${top.diagnosis}. ${top.supportingFindings.slice(0, 2).join("; ")}` : briefConclusion,
    recommendations: recs,
  };

  if (format === "brief") {
    return {
      format,
      gestationalAgeLabel: gaLabel,
      briefConclusion,
      detailedConclusion: briefConclusion,
      recommendations: recs.slice(0, 5),
      isuogDisclaimer: ISUOG_DISCLAIMER,
      sections: { ...sections, findings: input.findings, recommendations: recs.slice(0, 5) },
    };
  }

  if (format === "recommendations") {
    return {
      format,
      gestationalAgeLabel: gaLabel,
      briefConclusion: recs.join("; "),
      detailedConclusion: recs.join("\n"),
      recommendations: recs,
      isuogDisclaimer: ISUOG_DISCLAIMER,
      sections: { findings: input.findings, impression: briefConclusion, recommendations: recs },
    };
  }

  return {
    format: "detailed",
    gestationalAgeLabel: gaLabel,
    briefConclusion,
    detailedConclusion,
    recommendations: recs,
    isuogDisclaimer: ISUOG_DISCLAIMER,
    sections,
  };
}

/** Полный copilot-ответ для одной строки врача (Этап 10 preview). */
export function runSonographerCopilot(input: ReportInput) {
  const differential = generateDifferential(input);
  const analyses = input.findings.map((f) => analyzeFinding(f, input));
  const measurements = suggestMeasurements(input, input.findings);
  const views = suggestAdditionalViews(input, input.findings, differential);
  const report = generateReport(input, "detailed");
  const protocol = buildProtocolChecklist(
    input.gestationalAge?.weeks,
    collectAllTokens(input.findings, input.biometricData, input.dopplerData),
  );

  return {
    analyses,
    differential,
    measurements,
    views,
    protocol,
    report,
  };
}
