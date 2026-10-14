import { evaluateBirads, BI_RADS_VERSION, type BiradsInput } from "@repo/birads-us";
import { assessFirstTrimesterScreening, FMF_ENGINE_DISCLAIMER } from "@repo/fmf";
import { calculateORADS } from "@repo/orads-us/pro";
import type { OradsInput } from "@repo/orads-us/pro";
import {
  ACR_TIRADS_ENGINE_VERSION,
  evaluateAcrTirads,
  type TiradsAcrInput,
} from "@repo/tirads-acr";

import {
  validateToolCall,
  type AllowedAiToolName,
  type ToolExecutionResult,
} from "./schemas";

const ORADS_ENGINE_VERSION = "O-RADS US v2022";
const FMF_ENGINE_VERSION = "fmf-percentile-engine-v1";

function missingOradsFields(input: Record<string, unknown>): string[] {
  const missing: string[] = [];
  if (!input.menopause) missing.push("menopause");
  if (!input.lesionKind && !input.structure) missing.push("lesionKind или structure");
  return missing;
}

function missingFmfFields(input: Record<string, unknown>): string[] {
  const missing: string[] = [];
  if (input.crlMm == null) missing.push("crlMm");
  return missing;
}

/** Server-only execution — numbers come exclusively from local engines. */
export function executeClinicalTool(tool: string, input: unknown): ToolExecutionResult {
  const validated = validateToolCall(tool, input);
  if (!validated.ok) {
    return {
      tool: "calculate_orads",
      ok: false,
      engineVersion: "n/a",
      sourceLabel: "validation",
      inputEcho: typeof input === "object" && input ? (input as Record<string, unknown>) : {},
      error: validated.error,
    };
  }

  const { tool: name, parsed } = validated;

  if (name === "calculate_orads") {
    const missing = missingOradsFields(parsed);
    if (missing.length) {
      return {
        tool: name,
        ok: false,
        engineVersion: ORADS_ENGINE_VERSION,
        sourceLabel: "@repo/orads-us/pro",
        inputEcho: parsed,
        missingFields: missing,
        error: "Недостаточно данных для O-RADS — уточните менопаузальный статус и тип образования.",
      };
    }
    const result = calculateORADS(parsed as OradsInput);
    return {
      tool: name,
      ok: true,
      engineVersion: ORADS_ENGINE_VERSION,
      sourceLabel: "@repo/orads-us/pro/oradsCalculator",
      inputEcho: parsed,
      result: {
        category: result.category,
        riskText: result.riskText,
        recommendation: result.recommendation,
        rationale: result.rationale,
        volumeMl: result.volumeMl,
        warning: result.warning,
      },
    };
  }

  if (name === "calculate_birads") {
    const result = evaluateBirads(parsed as BiradsInput);
    return {
      tool: name,
      ok: true,
      engineVersion: BI_RADS_VERSION,
      sourceLabel: "@repo/birads-us",
      inputEcho: parsed,
      result: {
        category: result.category,
        riskRange: result.riskRange,
        recommendation: result.impression,
        description: result.description,
      },
    };
  }

  if (name === "calculate_tirads") {
    const tiradsInput = parsed as TiradsAcrInput;
    const result = evaluateAcrTirads(tiradsInput);
    return {
      tool: name,
      ok: true,
      engineVersion: ACR_TIRADS_ENGINE_VERSION,
      sourceLabel: "@repo/tirads-acr",
      inputEcho: parsed,
      result: {
        category: result.category,
        totalPoints: result.totalPoints,
        fnaRecommendation: result.fnaRationale,
        followUp: result.followUpRecommendation,
      },
    };
  }

  if (name === "assess_fmf_screening") {
    const missing = missingFmfFields(parsed);
    if (missing.length) {
      return {
        tool: name,
        ok: false,
        engineVersion: FMF_ENGINE_VERSION,
        sourceLabel: "@repo/fmf",
        inputEcho: parsed,
        missingFields: missing,
        error: "Укажите КТР (crlMm) для FMF-оценки I триместра.",
      };
    }
    const output = assessFirstTrimesterScreening({
      crlMm: parsed.crlMm as number,
      ntMm: parsed.ntMm as number | undefined,
      sbpMmHg: parsed.sbpMmHg as number | undefined,
      dbpMmHg: parsed.dbpMmHg as number | undefined,
    });
    return {
      tool: name,
      ok: true,
      engineVersion: FMF_ENGINE_VERSION,
      sourceLabel: "@repo/fmf/percentile-engine",
      inputEcho: parsed,
      result: {
        mapMmHg: output.mapMmHg,
        measurements: output.measurements.map((m) => ({
          label: m.labelRu,
          percentile: m.percentile,
          interpretation: m.interpretation,
        })),
        disclaimer: FMF_ENGINE_DISCLAIMER,
      },
    };
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
    name === "assess_fmf_screening"
  );
}
