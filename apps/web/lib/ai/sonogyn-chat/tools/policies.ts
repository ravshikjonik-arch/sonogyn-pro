import { buildBiradsDecisionPath, evaluateBirads, type BiradsInput } from "@repo/birads-us";
import {
  assessFirstTrimesterScreening,
  type FirstTrimesterScreeningInput,
  type FirstTrimesterScreeningOutput,
} from "@repo/fmf";
import { calculateSimpleRulesRisk, type SimpleRulesFeature } from "@repo/iota-models";
import { ENGINE_ROUTES } from "@repo/medical-intelligence";
import {
  COMPOSITION_OPTIONS,
  ECHOGENIC_FOCI_OPTIONS,
  ECHOGENICITY_OPTIONS,
  evaluateAcrTirads,
  MARGIN_OPTIONS,
  SHAPE_OPTIONS,
  type TiradsAcrInput,
} from "@repo/tirads-acr";

import {
  allSubsets,
  assignments,
  combinationCount,
  distinct,
  invariantProjection,
  MAX_PROBE_COMBINATIONS,
  nonEmptySubsets,
  omitKeys,
  sensitiveFields,
  worstStatus,
  type Probe,
  type SectionCompleteness,
  type ToolCompleteness,
} from "./completeness";
import { biradsOptionValues, NOT_ASSESSED } from "./schemas";

export type PolicyOutcome = {
  ok: boolean;
  result?: Record<string, unknown>;
  completeness: ToolCompleteness;
  missingFields?: string[];
  limitations?: string[];
  error?: string;
};

type Input = Record<string, unknown>;

function plain(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function unknownFields(probes: readonly Probe<Input>[]): string[] {
  return probes.map((p) => p.field);
}

function tooManyCombinations(fields: string[]): PolicyOutcome {
  return {
    ok: false,
    completeness: {
      category: { status: "incomplete", notAssessed: fields, reason: "too_many_unknowns" },
    },
    error: `Слишком много неоценённых признаков (${fields.join(", ")}) — расчёт не выполнен. Уточните дескрипторы.`,
  };
}

function describeSensitivity(sensitive: Map<string, string[]>, label: (k: string) => string): string {
  return [...sensitive.entries()].map(([field, keys]) => `${field} → ${keys.map(label).join(" / ")}`).join("; ");
}

/* ───────────────────────────── O-RADS ───────────────────────────── */

/**
 * Inputs the O-RADS v2022 grid reads as "no" (or as the default branch) when not provided.
 * Branch inputs select the lexicon row; modifiers (ascites, peritoneal nodules) only upgrade a result.
 * Domain values are the full value sets accepted by the tool schema (age: its min/max).
 */
const ORADS_BRANCH_DOMAIN: Record<string, readonly unknown[]> = {
  solidComponent: [false, true],
  solidType: ["smooth", "irregular", "papillary"],
  papillaryProjectionCount: ["0", "1", "2", "3", "4plus"],
  acousticShadows: [false, true],
};
const ORADS_AGE_DOMAIN = [10, 100] as const;
const ORADS_MODIFIER_DOMAIN: Record<string, readonly unknown[]> = {
  ascites: [false, true],
  peritonealNodules: [false, true],
};

const ABSTAINED = "—";

function oradsKey(input: Input): { category: string; recommendation: string } {
  const execution = ENGINE_ROUTES.orads_us_pro.execute(input);
  if (!execution.ok) return { category: ABSTAINED, recommendation: ABSTAINED };
  const r = execution.result as { category: number; recommendation: string };
  return { category: String(r.category), recommendation: r.recommendation };
}

const oradsLabel = (k: string) => (k === ABSTAINED ? "не рассчитывается" : `O-RADS ${k}`);

function probesFor(input: Input, domain: Record<string, readonly unknown[]>): Probe<Input>[] {
  return Object.entries(domain)
    .filter(([field]) => input[field] === undefined)
    .map(([field, values]) => ({ field, values }));
}

export function assessOrads(input: Input): PolicyOutcome {
  const execution = ENGINE_ROUTES.orads_us_pro.execute(input);
  if (!execution.ok) {
    // The placeholder `riskText` / `recommendation` carry a fictitious risk band; only explanatory fields are relayed.
    const engine = execution.result as { rationale?: string; warning?: string };
    return {
      ok: false,
      completeness: {
        category: { status: "incomplete", reason: "engine_abstained" },
        recommendation: { status: "incomplete", reason: "engine_abstained" },
      },
      error: ["Категория O-RADS не определена: движок не может выполнить расчёт по переданным данным.", engine.warning, engine.rationale]
        .filter(Boolean)
        .join(" "),
    };
  }

  const branch = probesFor(input, ORADS_BRANCH_DOMAIN);
  if (input.menopause === "post" && input.ageYears === undefined) {
    branch.push({ field: "ageYears", values: ORADS_AGE_DOMAIN });
  }
  const modifiers = probesFor(input, ORADS_MODIFIER_DOMAIN);
  const all = [...branch, ...modifiers];

  const base = oradsKey(input);
  const baseCategory = Number(base.category);
  const branchKeys = distinct(assignments(input, branch).map((i) => oradsKey(i).category));
  const allRuns = assignments(input, all).map(oradsKey);
  const possible = distinct([base.category, ...allRuns.map((k) => k.category)]).sort();
  const sensitive = sensitiveFields(input, all, (i) => i, (i) => oradsKey(i).category);
  const assumedAbsent = [...sensitive.keys()];

  const underestimates = branchKeys.some((k) => k === ABSTAINED || Number(k) > baseCategory);
  const categoryStatus = underestimates
    ? "incomplete"
    : possible.length > 1
      ? "provisional"
      : "complete";

  const category: SectionCompleteness = {
    status: categoryStatus,
    ...(assumedAbsent.length ? { assumedAbsent } : {}),
    ...(possible.length > 1 ? { possibleOutcomes: possible.map(oradsLabel) } : {}),
  };
  const recommendationVaries = distinct([base.recommendation, ...allRuns.map((k) => k.recommendation)]).length > 1;
  const recommendation: SectionCompleteness = {
    status: worstStatus(categoryStatus, recommendationVaries ? "provisional" : "complete"),
  };
  const detail = describeSensitivity(sensitive, oradsLabel);

  if (categoryStatus === "incomplete") {
    return {
      ok: false,
      completeness: { category, recommendation: { status: "incomplete" } },
      missingFields: assumedAbsent,
      error: `Категория O-RADS не определена: не переданы признаки, от которых зависит категория (${detail}). Возможные исходы: ${possible.map(oradsLabel).join(", ")}. Укажите их явно.`,
    };
  }

  const limitations: string[] = [];
  if (categoryStatus === "provisional") {
    limitations.push(
      `Предварительно: не переданы ${assumedAbsent.join(", ")} — движок считает их отсутствующими; при других значениях: ${detail}.`,
    );
  } else if (recommendation.status === "provisional") {
    limitations.push("Тактика зависит от непереданных признаков — проверьте рекомендацию.");
  }

  return {
    ok: true,
    result: plain(execution.result),
    completeness: { category, recommendation },
    limitations: limitations.length ? limitations : undefined,
  };
}

/* ──────────────────────────── TI-RADS ──────────────────────────── */

const TIRADS_DESCRIPTOR_DOMAIN: Record<string, readonly unknown[]> = {
  composition: COMPOSITION_OPTIONS.map((o) => o.value),
  echogenicity: ECHOGENICITY_OPTIONS.map((o) => o.value),
  shape: SHAPE_OPTIONS.map((o) => o.value),
  margin: MARGIN_OPTIONS.map((o) => o.value),
  echogenicFoci: nonEmptySubsets(ECHOGENIC_FOCI_OPTIONS.map((o) => o.value)),
};
/** Extremes of plausible nodule size, mm: the engine reads an absent size as its smallest band. */
const TIRADS_SIZE_DOMAIN = [1, 1000] as const;
const TIRADS_LYMPH_DOMAIN = ["benign", "indeterminate", "suspicious"] as const;
export const TIRADS_RECOMMENDATION_KEYS = [
  "fnaRecommended",
  "fnaRationale",
  "followUpRecommendation",
  "observationRecommendation",
] as const;
/** The decision itself; rationale texts interpolate the size and are not compared. */
const TIRADS_DECISION_KEYS = ["fnaRecommended", "followUpRecommendation"] as const;

function runTirads(input: Input): Record<string, unknown> {
  return plain(evaluateAcrTirads(input as TiradsAcrInput));
}

export function assessTirads(input: Input): PolicyOutcome {
  const descriptorProbes = Object.entries(TIRADS_DESCRIPTOR_DOMAIN)
    .filter(([field]) => input[field] === NOT_ASSESSED)
    .map(([field, values]) => ({ field, values }));
  const notAssessed = unknownFields(descriptorProbes);
  const sizeProbe: Probe<Input> | undefined =
    input.largestDiameterMm === undefined ? { field: "largestDiameterMm", values: TIRADS_SIZE_DOMAIN } : undefined;

  if (combinationCount([...descriptorProbes, ...(sizeProbe ? [sizeProbe] : [])]) > MAX_PROBE_COMBINATIONS) {
    return tooManyCombinations(notAssessed);
  }

  const categoryRuns = assignments(input, descriptorProbes).map(runTirads);
  const categories = distinct(categoryRuns.map((r) => String(r.category))).sort();
  if (categories.length > 1) {
    return {
      ok: false,
      completeness: {
        category: { status: "incomplete", notAssessed, possibleOutcomes: categories },
        recommendation: { status: "incomplete" },
      },
      error: `Категория ACR TI-RADS не определена: не оценены ${notAssessed.join(", ")}; возможны ${categories.join(", ")}.`,
    };
  }

  const categoryResult = descriptorProbes.length ? invariantProjection(categoryRuns) : categoryRuns[0]!;
  const recRuns = [...categoryRuns, ...assignments(input, [...descriptorProbes, ...(sizeProbe ? [sizeProbe] : [])]).map(runTirads)];
  const decision = invariantProjection(
    recRuns.map((r) => Object.fromEntries(TIRADS_DECISION_KEYS.map((k) => [k, r[k]]))),
  );
  const undetermined = TIRADS_DECISION_KEYS.filter((k) => !(k in decision));
  const recProjection = undetermined.length
    ? decision
    : Object.fromEntries(TIRADS_RECOMMENDATION_KEYS.filter((k) => k in categoryResult).map((k) => [k, categoryResult[k]]));

  const limitations: string[] = [];
  let recommendation: SectionCompleteness;
  if (undetermined.length) {
    recommendation = {
      status: "incomplete",
      missing: sizeProbe ? ["largestDiameterMm"] : undefined,
      notAssessed: notAssessed.length ? notAssessed : undefined,
      reason: "size_dependent",
    };
    limitations.push(
      recProjection.fnaRecommended === true
        ? "Наибольший диаметр узла не указан: ТАБ показана независимо от размера, но интервал наблюдения по размеру не рассчитан."
        : "Наибольший диаметр узла не указан — показания к ТАБ и интервал наблюдения по размеру не рассчитаны (не означает отсутствия показаний).",
    );
  } else {
    const lymphUnknown = input.lymphNodes === undefined || input.lymphNodes === NOT_ASSESSED;
    const lymphChangesFna =
      lymphUnknown &&
      distinct(
        assignments(input, [...descriptorProbes, { field: "lymphNodes", values: TIRADS_LYMPH_DOMAIN }]).map((i) =>
          String(runTirads(i).fnaRecommended),
        ),
      ).length > 1;
    recommendation = lymphChangesFna
      ? { status: "provisional", assumedAbsent: ["lymphNodes"], reason: "lymph_nodes_not_assessed" }
      : { status: "complete" };
    if (lymphChangesFna) {
      limitations.push("Шейные лимфоузлы не оценены: при подозрительных ЛУ движок рекомендует ТАБ независимо от категории и размера.");
    }
  }

  return {
    ok: true,
    result: { ...omitKeys(categoryResult, TIRADS_RECOMMENDATION_KEYS), ...recProjection },
    completeness: {
      category: { status: "complete", ...(notAssessed.length ? { notAssessed } : {}) },
      recommendation,
    },
    missingFields: sizeProbe && undetermined.length ? ["largestDiameterMm"] : undefined,
    limitations: limitations.length ? limitations : undefined,
  };
}

/* ──────────────────────────── BI-RADS ──────────────────────────── */

const BIRADS_DESCRIPTORS = ["shape", "margin", "echoPattern", "vascularity", "orientation", "posteriorFeatures"] as const;
const BIRADS_NO_RULE = "no_rule";

function runBirads(input: Input): { result: Record<string, unknown>; key: string } {
  const engineInput = input as BiradsInput;
  const fallback = buildBiradsDecisionPath(engineInput).some((step) => step.startsWith("Итог: fallback"));
  const result = plain(evaluateBirads(engineInput));
  return { result, key: fallback ? BIRADS_NO_RULE : String(result.category) };
}

export function assessBirads(input: Input): PolicyOutcome {
  const probes = BIRADS_DESCRIPTORS.filter((f) => input[f] === NOT_ASSESSED).map((field) => ({
    field,
    values: biradsOptionValues(field),
  }));
  const notAssessed = unknownFields(probes);
  if (combinationCount(probes) > MAX_PROBE_COMBINATIONS) return tooManyCombinations(notAssessed);

  const runs = assignments(input, probes).map(runBirads);
  const keys = distinct(runs.map((r) => r.key)).sort();
  const label = (k: string) => (k === BIRADS_NO_RULE ? "нет правила (fallback BI-RADS 0)" : k);

  if (keys.includes(BIRADS_NO_RULE) && keys.length === 1) {
    const fallback = runs[0]!.result as { impression?: string };
    return {
      ok: false,
      completeness: { category: { status: "incomplete", reason: "no_matching_rule", ...(notAssessed.length ? { notAssessed } : {}) } },
      error: `Сочетание дескрипторов не покрыто правилами локального BI-RADS ruleset — категория не рассчитана (fallback BI-RADS 0). ${fallback.impression ?? ""}`.trim(),
    };
  }
  if (keys.length > 1) {
    return {
      ok: false,
      completeness: {
        category: { status: "incomplete", notAssessed, possibleOutcomes: keys.map(label) },
      },
      error: `Категория BI-RADS не определена: не оценены ${notAssessed.join(", ")}; возможны: ${keys.map(label).join(", ")}.`,
    };
  }

  return {
    ok: true,
    result: invariantProjection(runs.map((r) => r.result)),
    completeness: { category: { status: "complete", ...(notAssessed.length ? { notAssessed } : {}) } },
  };
}

/* ─────────────────────────── IOTA models ─────────────────────────── */

const percent = (p: number) => `${(p * 100).toFixed(1)}%`;

/** Domains of the categorical / boolean IOTA predictors (the values the tool schema accepts). */
export const IOTA_PREDICTOR_DOMAIN: Record<string, readonly unknown[]> = {
  oncologyCenter: [false, true],
  moreThan10Locules: [false, true],
  acousticShadows: [false, true],
  ascites: [false, true],
  papillaryCount: [0, 1, 2, 3, "4plus"],
  bloodFlowInSolidPapillary: [false, true],
  irregularInternalWalls: [false, true],
};

/**
 * Predictors reported as not assessed are enumerated over their domain; the model's risk range is reported
 * and the estimate is withheld. No risk is computed from a guessed predictor.
 */
export function assessIotaUnknowns(
  modelLabel: string,
  input: Input,
  notAssessed: readonly string[],
  run: (i: Input) => { malignancyRisk: number } | { errors: unknown[] },
): PolicyOutcome | null {
  const probes = notAssessed
    .filter((f) => f in IOTA_PREDICTOR_DOMAIN)
    .map((field) => ({ field, values: IOTA_PREDICTOR_DOMAIN[field]! }));
  if (!probes.length) return null;
  const risks = assignments(input, probes).flatMap((i) => {
    const r = run(i);
    return "errors" in r ? [] : [r.malignancyRisk];
  });
  const fields = unknownFields(probes);
  const range = risks.length ? `${percent(Math.min(...risks))}–${percent(Math.max(...risks))}` : undefined;
  return {
    ok: false,
    completeness: {
      category: { status: "incomplete", notAssessed: fields, ...(range ? { possibleOutcomes: [range] } : {}) },
    },
    missingFields: fields,
    error: `Риск по ${modelLabel} не определён: не оценены ${fields.join(", ")}${range ? `; в зависимости от них риск по модели ${range}` : ""}.`,
  };
}

/* ─────────────────────── IOTA Simple Rules Risk ─────────────────────── */

export function assessSimpleRulesRisk(input: {
  oncologyCenter: boolean | typeof NOT_ASSESSED;
  benignFeatures: SimpleRulesFeature[];
  malignantFeatures: SimpleRulesFeature[];
  notAssessedFeatures?: SimpleRulesFeature[];
}): PolicyOutcome & { engineResult?: ReturnType<typeof calculateSimpleRulesRisk> } {
  const notAssessed = distinct(input.notAssessedFeatures ?? []) as SimpleRulesFeature[];
  const centres = input.oncologyCenter === NOT_ASSESSED ? [false, true] : [input.oncologyCenter];
  const run = (extra: SimpleRulesFeature[], oncologyCenter: boolean) =>
    calculateSimpleRulesRisk({
      oncologyCenter,
      benignFeatures: [...input.benignFeatures, ...extra.filter((f) => f.startsWith("B"))],
      malignantFeatures: [...input.malignantFeatures, ...extra.filter((f) => f.startsWith("M"))],
    });

  if (notAssessed.length || centres.length > 1) {
    const risks = allSubsets(notAssessed)
      .flatMap((extra) => centres.map((c) => run(extra, c)))
      .flatMap((r) => ("errors" in r ? [] : [r.malignancyRisk]));
    const range = `${percent(Math.min(...risks))}–${percent(Math.max(...risks))}`;
    const fields = [...notAssessed, ...(centres.length > 1 ? ["oncologyCenter"] : [])];
    return {
      ok: false,
      completeness: { category: { status: "incomplete", notAssessed: fields, possibleOutcomes: [range] } },
      missingFields: fields,
      error: `Риск по IOTA Simple Rules Risk не определён: не оценены ${fields.join(", ")}; в зависимости от них риск по модели ${range}.`,
    };
  }

  const engineResult = run([], centres[0]!);
  const limitations =
    !("errors" in engineResult) && input.benignFeatures.length === 0 && input.malignantFeatures.length === 0
      ? ["Ни один признак B/M не отмечен: расчёт предполагает, что все 10 признаков оценены и отсутствуют."]
      : undefined;
  return { ok: true, engineResult, completeness: { category: { status: "complete" } }, limitations };
}

/* ───────────────────────────── FMF ───────────────────────────── */

/** Input group → engine output id that should appear when the group is provided. */
const FMF_OUTPUTS: Array<{ fields: (keyof FirstTrimesterScreeningInput)[]; id: string; needsAll?: boolean }> = [
  { fields: ["crlMm"], id: "crl" },
  { fields: ["ntMm"], id: "nt" },
  { fields: ["msdMm"], id: "msd" },
  { fields: ["ysdMm"], id: "ysd" },
  { fields: ["dvPi"], id: "dv" },
  { fields: ["fhrBpm"], id: "fhr" },
  { fields: ["uterinePiLeft", "uterinePiRight"], id: "uta" },
  { fields: ["sbpMmHg", "dbpMmHg"], id: "map" },
  { fields: ["nasalBone"], id: "nasal_bone" },
  { fields: ["tricuspidVelocityCmS", "tricuspidDurationFraction", "tricuspidRegurg"], id: "tricuspid_regurgitation" },
  { fields: ["dvAWave"], id: "dv_a_wave" },
];

export function assessFmf(input: FirstTrimesterScreeningInput): PolicyOutcome & { output: FirstTrimesterScreeningOutput } {
  const output = assessFirstTrimesterScreening(input);
  const produced = new Set([
    ...output.measurements.map((m) => m.parameterId),
    ...output.categorical.map((c) => c.parameterId),
  ]);
  const notEvaluated = FMF_OUTPUTS.filter(
    (o) => o.fields.some((f) => input[f] !== undefined) && !produced.has(o.id),
  ).flatMap((o) => o.fields.filter((f) => input[f] !== undefined));

  if (produced.size === 0) {
    return {
      ok: false,
      output,
      completeness: { category: { status: "incomplete", missing: notEvaluated, reason: "nothing_evaluated" } },
      error: "Ни один параметр не оценён движком (вне диапазона референсных кривых или не хватает парных значений).",
    };
  }
  return {
    ok: true,
    output,
    completeness: {
      category: notEvaluated.length
        ? { status: "provisional", missing: notEvaluated, reason: "not_evaluated_inputs" }
        : { status: "complete" },
    },
    limitations: notEvaluated.length
      ? [
          `Указаны, но не оценены движком: ${notEvaluated.join(", ")} (нет парного значения, срока или вне диапазона референса).`,
        ]
      : undefined,
  };
}
