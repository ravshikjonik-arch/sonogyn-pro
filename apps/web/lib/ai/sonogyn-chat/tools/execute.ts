import { BI_RADS_VERSION } from "@repo/birads-us";
import { FMF_ENGINE_DISCLAIMER, type FirstTrimesterScreeningInput } from "@repo/fmf";
import { ORADS_ENGINE_VERSION } from "@repo/medical-intelligence";
import {
  calculateAdnex,
  calculateLr2,
  compareIotaRiskWithOrads,
  type AdnexInput,
  type Lr2Input,
  type SimpleRulesFeature,
} from "@repo/iota-models";
import { ACR_TIRADS_ENGINE_VERSION, type TiradsAcrInput } from "@repo/tirads-acr";

import { worstStatus, type ToolCompleteness } from "./completeness";
import { buildInputReview, isReviewGated, type InputReview, type ReviewState } from "./input-review";
import {
  assessBirads,
  assessFmf,
  assessIotaUnknowns,
  assessOrads,
  assessSimpleRulesRisk,
  assessTirads,
  type PolicyOutcome,
} from "./policies";
import {
  NOT_ASSESSED,
  validateToolCall,
  type AllowedAiToolName,
  type ToolExecutionResult,
} from "./schemas";

const FMF_ENGINE_VERSION = "fmf-percentile-engine-v1";
const IOTA_MODELS_SOURCE = "@repo/iota-models";
const IOTA_DISCLAIMER =
  "Assistive estimate; not a histologic diagnosis. Clinical decision remains with the treating specialist.";

/** Boolean findings the O-RADS v2022 grid reads as "absent" when they are not provided. */
const ORADS_ABSENT_AS_NO = ["solidComponent", "ascites", "peritonealNodules", "acousticShadows"] as const;

/**
 * Required descriptors: an excluded (assumed) value becomes `not_assessed` so the policy enumerates it.
 * Optional findings are simply removed (= not provided).
 */
const REQUIRED_DESCRIPTORS: Partial<Record<AllowedAiToolName, readonly string[]>> = {
  calculate_birads: ["shape", "margin", "echoPattern", "vascularity", "orientation", "posteriorFeatures"],
  calculate_tirads: ["composition", "echogenicity", "shape", "margin", "echogenicFoci"],
  calculate_adnex: ["oncologyCenter", "moreThan10Locules", "papillaryCount", "acousticShadows", "ascites"],
  calculate_lr2: ["ascites", "bloodFlowInSolidPapillary", "irregularInternalWalls", "acousticShadows"],
  calculate_srrisk: ["oncologyCenter"],
};
/** Required measurements: cannot be enumerated, so an assumed value makes the call incomplete. */
const REQUIRED_MEASUREMENTS: Partial<Record<AllowedAiToolName, readonly string[]>> = {
  calculate_adnex: ["ageYears", "maxDiameterMm", "maxSolidDiameterMm"],
  calculate_lr2: ["ageYears", "maxSolidDiameterMm"],
  calculate_birads: ["findingType"],
};
/** Tools whose policies read `not_assessed` values directly. */
const KEEPS_NOT_ASSESSED: readonly AllowedAiToolName[] = ["calculate_birads", "calculate_tirads", "calculate_adnex", "calculate_lr2", "calculate_srrisk"];

export type ExecuteOptions = {
  /** Fields confirmed by the physician (review card). Only these count as confirmed inputs. */
  confirmedFields?: readonly string[];
};

type Prepared = {
  engineInput: Record<string, unknown>;
  review: InputReview;
  assumedRequiredMeasurements: string[];
};

/** Engine outputs are plain data; JSON normalisation drops `undefined` keys so results compare 1:1. */
function plain(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function absentKeys(input: Record<string, unknown>, keys: readonly string[]): string[] {
  return keys.filter((k) => input[k] === undefined);
}

function prepareInput(tool: AllowedAiToolName, parsed: Record<string, unknown>, options: ExecuteOptions): Prepared {
  const { assumedFields, ...raw } = parsed as Record<string, unknown> & { assumedFields?: string[] };
  const confirmed = new Set(options.confirmedFields ?? []);
  const assumed = [...new Set(assumedFields ?? [])].filter((f) => !confirmed.has(f) && f in raw);
  const notAssessed = Object.entries(raw)
    .filter(([, v]) => v === NOT_ASSESSED)
    .map(([k]) => k);

  const engineInput: Record<string, unknown> = { ...raw };
  const required = REQUIRED_DESCRIPTORS[tool] ?? [];
  for (const field of assumed) {
    if (required.includes(field)) engineInput[field] = NOT_ASSESSED;
    else if (tool === "calculate_srrisk" && (field === "benignFeatures" || field === "malignantFeatures")) {
      const prefix = field === "benignFeatures" ? "B" : "M";
      engineInput[field] = [];
      engineInput.notAssessedFeatures = [
        ...new Set([
          ...((engineInput.notAssessedFeatures as SimpleRulesFeature[] | undefined) ?? []),
          ...([1, 2, 3, 4, 5].map((n) => `${prefix}${n}`) as SimpleRulesFeature[]),
        ]),
      ];
    } else delete engineInput[field];
  }
  if (!KEEPS_NOT_ASSESSED.includes(tool)) {
    for (const field of notAssessed) delete engineInput[field];
  }

  return {
    engineInput,
    review: buildInputReview({ input: raw, assumed, notAssessed, confirmed: [...confirmed] }),
    assumedRequiredMeasurements: assumed.filter((f) => (REQUIRED_MEASUREMENTS[tool] ?? []).includes(f)),
  };
}

function reviewStateFor(tool: AllowedAiToolName, review: InputReview): ReviewState {
  if (!isReviewGated(tool)) return { required: false, state: "not_required" };
  return { required: true, state: review.unconfirmed.length === 0 && review.assumed.length === 0 ? "confirmed" : "pending" };
}

function statusOf(completeness: ToolCompleteness) {
  return worstStatus(completeness.category.status, completeness.recommendation?.status);
}

type Base = Pick<ToolExecutionResult, "tool" | "engineVersion" | "sourceLabel" | "inputEcho">;

function fromPolicy(
  base: Base,
  prepared: Prepared,
  outcome: PolicyOutcome,
  extra?: Partial<ToolExecutionResult>,
): ToolExecutionResult {
  return {
    ...base,
    ok: outcome.ok,
    status: statusOf(outcome.completeness),
    completeness: outcome.completeness,
    ...(outcome.ok && outcome.result ? { result: outcome.result } : {}),
    ...(outcome.missingFields?.length ? { missingFields: outcome.missingFields } : {}),
    ...(outcome.limitations?.length ? { limitations: outcome.limitations } : {}),
    ...(outcome.error ? { error: outcome.error } : {}),
    inputReview: prepared.review,
    review: reviewStateFor(base.tool, prepared.review),
    ...extra,
  };
}

function incomplete(base: Base, prepared: Prepared, missing: string[], error: string, withRecommendation = false): ToolExecutionResult {
  return fromPolicy(base, prepared, {
    ok: false,
    completeness: {
      category: { status: "incomplete", missing },
      ...(withRecommendation ? { recommendation: { status: "incomplete" as const } } : {}),
    },
    missingFields: missing,
    error,
  });
}

const ASSUMED_MEASUREMENT_ERROR = (fields: string[]) =>
  `Значения ${fields.join(", ")} предположены моделью и в расчёт не включены; нужны измеренные значения.`;

/** `calculateORADS` reaches the v2022 grid only with an explicit lesion kind (or extraovarian localisation). */
function missingOradsFields(input: Record<string, unknown>): string[] {
  const missing: string[] = [];
  if (!input.menopause) missing.push("menopause");
  if (!input.lesionKind && input.localization !== "extraovarian") missing.push("lesionKind");
  return missing;
}

function knownToolName(tool: string): AllowedAiToolName {
  return isAllowedToolName(tool) ? tool : "calculate_orads";
}

function executeOrads(base: Base, prepared: Prepared): ToolExecutionResult {
  const input = prepared.engineInput;
  const missing = missingOradsFields(input);
  if (missing.length) {
    return {
      ...incomplete(
        { ...base, sourceLabel: "@repo/orads-us/pro" },
        prepared,
        missing,
        `Недостаточно данных для O-RADS: ${missing.join(", ")}. lesionKind: nonphysiological — любая киста или образование, кроме фолликула / жёлтого тела / нормального яичника.`,
        true,
      ),
    };
  }
  const notProvided = input.lesionKind === "nonphysiological" ? absentKeys(input, ORADS_ABSENT_AS_NO) : [];
  return fromPolicy(base, prepared, assessOrads(input), notProvided.length ? { notProvided } : undefined);
}

function toTiradsEngineInput(input: Record<string, unknown>): Record<string, unknown> {
  const { maxDiameterMm, largestDiameterMm, ...rest } = input as Record<string, unknown> & {
    maxDiameterMm?: number;
    largestDiameterMm?: number;
  };
  const size = largestDiameterMm ?? maxDiameterMm;
  return { ...rest, ...(size !== undefined ? { largestDiameterMm: size } : {}) } satisfies Partial<
    Record<keyof TiradsAcrInput, unknown>
  >;
}

function executeTirads(base: Base, prepared: Prepared): ToolExecutionResult {
  const engineInput = toTiradsEngineInput(prepared.engineInput);
  const notProvided = absentKeys(engineInput, ["largestDiameterMm", "lymphNodes"]);
  return fromPolicy(base, prepared, assessTirads(engineInput), notProvided.length ? { notProvided } : undefined);
}

function iotaCompare(oradsCategory: number | undefined, malignancyRisk: number) {
  return oradsCategory != null ? compareIotaRiskWithOrads(malignancyRisk, { categoryNumber: oradsCategory }) : undefined;
}

/** Server-only execution — numbers come exclusively from local engines. */
export function executeClinicalTool(tool: string, input: unknown, options: ExecuteOptions = {}): ToolExecutionResult {
  const validated = validateToolCall(tool, input);
  if (!validated.ok) {
    return {
      tool: knownToolName(tool),
      ok: false,
      rejected: true,
      status: "incomplete",
      engineVersion: "n/a",
      sourceLabel: "validation",
      inputEcho: typeof input === "object" && input ? (input as Record<string, unknown>) : {},
      validationIssues: validated.issues,
      error: validated.error,
    };
  }

  const { tool: name, parsed } = validated;
  const prepared = prepareInput(name, parsed, options);
  const input0 = prepared.engineInput;

  if (name === "calculate_orads") {
    return executeOrads(
      { tool: name, engineVersion: ORADS_ENGINE_VERSION, sourceLabel: "@repo/orads-us/pro/oradsCalculator", inputEcho: parsed },
      prepared,
    );
  }

  if (name === "calculate_birads") {
    const base = { tool: name, engineVersion: BI_RADS_VERSION, sourceLabel: "@repo/birads-us", inputEcho: parsed };
    if (prepared.assumedRequiredMeasurements.length) {
      return incomplete(base, prepared, prepared.assumedRequiredMeasurements, ASSUMED_MEASUREMENT_ERROR(prepared.assumedRequiredMeasurements));
    }
    return fromPolicy(base, prepared, assessBirads(input0));
  }

  if (name === "calculate_tirads") {
    return executeTirads(
      { tool: name, engineVersion: ACR_TIRADS_ENGINE_VERSION, sourceLabel: "@repo/tirads-acr", inputEcho: parsed },
      prepared,
    );
  }

  if (name === "calculate_adnex") {
    const base = { tool: name, engineVersion: "IOTA ADNEX", sourceLabel: IOTA_MODELS_SOURCE, inputEcho: parsed };
    if (prepared.assumedRequiredMeasurements.length) {
      return incomplete(base, prepared, prepared.assumedRequiredMeasurements, ASSUMED_MEASUREMENT_ERROR(prepared.assumedRequiredMeasurements));
    }
    const { oradsCategory, ...adnexInput } = input0 as Record<string, unknown> & { oradsCategory?: number };
    const unknown = assessIotaUnknowns(
      "IOTA ADNEX",
      adnexInput,
      Object.keys(adnexInput).filter((k) => adnexInput[k] === NOT_ASSESSED),
      (i) => calculateAdnex(i as AdnexInput) as { malignancyRisk: number } | { errors: unknown[] },
    );
    if (unknown) return fromPolicy(base, prepared, unknown);
    const computed = calculateAdnex(adnexInput as AdnexInput);
    if ("errors" in computed) {
      return { ...incomplete(base, prepared, [], computed.errors.map((e) => e.messageKey).join("; ")), rejected: true };
    }
    const compare = iotaCompare(oradsCategory, computed.malignancyRisk);
    return fromPolicy(
      { ...base, engineVersion: `${computed.modelId} ${computed.modelVersion}` },
      prepared,
      {
        ok: true,
        completeness: { category: { status: "complete" } },
        result: { ...plain(computed), ...(compare ? { compareWithOrads: plain(compare) } : {}), disclaimer: IOTA_DISCLAIMER },
        limitations: computed.usedCa125 ? undefined : ["CA-125 не указан — использована модель ADNEX без CA-125."],
      },
    );
  }

  if (name === "calculate_lr2") {
    const base = { tool: name, engineVersion: "IOTA LR2", sourceLabel: IOTA_MODELS_SOURCE, inputEcho: parsed };
    if (prepared.assumedRequiredMeasurements.length) {
      return incomplete(base, prepared, prepared.assumedRequiredMeasurements, ASSUMED_MEASUREMENT_ERROR(prepared.assumedRequiredMeasurements));
    }
    const unknown = assessIotaUnknowns(
      "IOTA LR2",
      input0,
      Object.keys(input0).filter((k) => input0[k] === NOT_ASSESSED),
      (i) => calculateLr2(i as Lr2Input) as { malignancyRisk: number } | { errors: unknown[] },
    );
    if (unknown) return fromPolicy(base, prepared, unknown);
    const computed = calculateLr2(input0 as Lr2Input);
    if ("errors" in computed) {
      return { ...incomplete(base, prepared, [], computed.errors.map((e) => e.messageKey).join("; ")), rejected: true };
    }
    return fromPolicy({ ...base, engineVersion: `${computed.modelId} ${computed.modelVersion}` }, prepared, {
      ok: true,
      completeness: { category: { status: "complete" } },
      result: { ...plain(computed), disclaimer: IOTA_DISCLAIMER },
    });
  }

  if (name === "calculate_srrisk") {
    const { oradsCategory, ...srrInput } = input0 as {
      oradsCategory?: number;
      oncologyCenter: boolean | typeof NOT_ASSESSED;
      benignFeatures: SimpleRulesFeature[];
      malignantFeatures: SimpleRulesFeature[];
      notAssessedFeatures?: SimpleRulesFeature[];
    };
    const base = { tool: name, engineVersion: "IOTA Simple Rules Risk", sourceLabel: IOTA_MODELS_SOURCE, inputEcho: parsed };
    const outcome = assessSimpleRulesRisk(srrInput);
    const computed = outcome.engineResult;
    if (!outcome.ok || !computed) return fromPolicy(base, prepared, outcome);
    if ("errors" in computed) {
      return { ...incomplete(base, prepared, [], computed.errors.map((e) => e.messageKey).join("; ")), rejected: true };
    }
    const compare = iotaCompare(oradsCategory, computed.malignancyRisk);
    return fromPolicy({ ...base, engineVersion: `${computed.modelId} ${computed.modelVersion}` }, prepared, {
      ...outcome,
      result: { ...plain(computed), ...(compare ? { compareWithOrads: plain(compare) } : {}), disclaimer: IOTA_DISCLAIMER },
    });
  }

  if (name === "assess_fmf_screening") {
    const base = { tool: name, engineVersion: FMF_ENGINE_VERSION, sourceLabel: "@repo/fmf", inputEcho: parsed };
    if (input0.crlMm == null) {
      return incomplete(base, prepared, ["crlMm"], "Укажите КТР (crlMm) для FMF-оценки I триместра.");
    }
    const outcome = assessFmf(input0 as FirstTrimesterScreeningInput);
    return fromPolicy({ ...base, sourceLabel: "@repo/fmf/percentile-engine" }, prepared, {
      ...outcome,
      result: { ...plain(outcome.output), disclaimer: FMF_ENGINE_DISCLAIMER },
    });
  }

  return {
    tool: name,
    ok: false,
    engineVersion: "n/a",
    sourceLabel: "unknown",
    inputEcho: parsed,
    error: "Unsupported tool",
  };
}

export function isAllowedToolName(name: string): name is AllowedAiToolName {
  return (
    name === "calculate_orads" ||
    name === "calculate_birads" ||
    name === "calculate_tirads" ||
    name === "calculate_adnex" ||
    name === "calculate_lr2" ||
    name === "calculate_srrisk" ||
    name === "assess_fmf_screening"
  );
}
