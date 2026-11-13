/**
 * Explicit routing adapters for the four engines integrated in Phase C.
 * Each route = canonical observations → existing morphology adapter (strict, no allowPartial)
 * → existing engine public API. No clinical math here.
 *
 * Engines are called directly, NOT through `executeClinicalTool`: its Zod tool schemas strip
 * fields (O-RADS echogenicity/papillae/colour score/shadows/ascites, TI-RADS size) and the
 * engine then defaults them (verified: O-RADS 5 direct vs 4 via the tool).
 */
import { BI_RADS_VERSION, evaluateBirads } from "@repo/birads-us";
import {
  BIRADS_US_SPEC,
  MUSA_ADENOMYOSIS_SPEC,
  ORADS_US_PRO_SPEC,
  TIRADS_ACR_SPEC,
  toBiradsUsInput,
  toMusaAdenomyosisInput,
  toOradsProInput,
  toTiradsAcrInput,
  type MorphologyAnatomy,
  type MorphologyObservation,
  type OradsClinicalContext,
  type ToEngineResult,
} from "@repo/morphology-core";
import {
  calculateAdenomyosisScore,
  MUSA_ADENOMYOSIS_KNOWLEDGE,
  type MusaAdenomyosisAssessmentInput,
} from "@repo/musa-framework";
import { calculateORADS, type OradsInput } from "@repo/orads-us/pro";
import { evaluateAcrTirads, type TiradsAcrInput } from "@repo/tirads-acr";
import type { BiradsInput } from "@repo/birads-us";

import type { MiEngineId } from "./contracts";

/** Same label `executeClinicalTool` stamps for O-RADS (no version constant is exported by @repo/orads-us). */
export const ORADS_ENGINE_VERSION = "O-RADS US v2022";

export type EngineExecution =
  | {
      ok: true;
      engineVersion: string;
      sourceLabel: string;
      categoryLabel: string;
      result: Record<string, unknown>;
      disclaimer: string;
    }
  /** The engine itself signalled that it could not assess (placeholder output). */
  | { ok: false; abstained: true; engineVersion: string; reason: string; result: Record<string, unknown> };

export type EngineRoute = {
  engineId: MiEngineId;
  label: string;
  anatomies: readonly MorphologyAnatomy[];
  toInput(
    observations: readonly MorphologyObservation[],
    ctx: { clinicalContext?: OradsClinicalContext; subjectId?: string },
  ): ToEngineResult<Record<string, unknown>>;
  execute(input: Record<string, unknown>): EngineExecution;
  evidenceQuery(categoryLabel: string): string;
};

const CDS = "Справочно (CDS). Не диагноз; решение принимает лечащий врач.";

/**
 * O-RADS Pro returns a numeric category 3 as a placeholder when the v2022 grid lacks data
 * (`riskText` "Нужны данные для расчёта" / "Требуется переклассификация", or the generic
 * "Недостаточно структурированных признаков" branch). Treated as abstention, never as a result.
 * Defence in depth behind the adapter completeness gate — tied to engine strings.
 */
const ORADS_PLACEHOLDER_RISK = new Set(["Нужны данные для расчёта", "Требуется переклассификация"]);

/** Placeholder `riskText` carries a fictitious risk band and is never relayed. */
const ENGINE_ABSTAINED_REASON = "Engine could not assess the provided data.";

export const ENGINE_ROUTES: Readonly<Record<MiEngineId, EngineRoute>> = {
  orads_us_pro: {
    engineId: "orads_us_pro",
    label: "O-RADS US",
    anatomies: ORADS_US_PRO_SPEC.anatomies,
    toInput: (obs, ctx) =>
      toOradsProInput(obs, ctx.clinicalContext ?? {}, { subjectId: ctx.subjectId }) as ToEngineResult<Record<string, unknown>>,
    execute(input) {
      const r = calculateORADS(input as OradsInput);
      const placeholder =
        ORADS_PLACEHOLDER_RISK.has(r.riskText) || r.rationale.startsWith("Недостаточно структурированных признаков");
      if (placeholder) {
        return {
          ok: false,
          abstained: true,
          engineVersion: ORADS_ENGINE_VERSION,
          reason: [ENGINE_ABSTAINED_REASON, r.warning, r.rationale].filter(Boolean).join(" "),
          result: r as unknown as Record<string, unknown>,
        };
      }
      return {
        ok: true,
        engineVersion: ORADS_ENGINE_VERSION,
        sourceLabel: "@repo/orads-us/pro · calculateORADS",
        categoryLabel: `O-RADS ${r.category}`,
        result: r as unknown as Record<string, unknown>,
        disclaimer: CDS,
      };
    },
    evidenceQuery: (label) => `${label} тактика ведения образования придатков`,
  },
  birads_us: {
    engineId: "birads_us",
    label: "BI-RADS US",
    anatomies: BIRADS_US_SPEC.anatomies,
    toInput: (obs, ctx) => toBiradsUsInput(obs, { subjectId: ctx.subjectId }) as ToEngineResult<Record<string, unknown>>,
    execute(input) {
      const r = evaluateBirads(input as BiradsInput);
      return {
        ok: true,
        engineVersion: BI_RADS_VERSION,
        sourceLabel: "@repo/birads-us · evaluateBirads",
        categoryLabel: `BI-RADS ${r.category}`,
        result: r as unknown as Record<string, unknown>,
        disclaimer: CDS,
      };
    },
    evidenceQuery: (label) => `${label} тактика ведения образования молочной железы УЗИ`,
  },
  tirads_acr: {
    engineId: "tirads_acr",
    label: "ACR TI-RADS",
    anatomies: TIRADS_ACR_SPEC.anatomies,
    toInput: (obs, ctx) => toTiradsAcrInput(obs, { subjectId: ctx.subjectId }) as ToEngineResult<Record<string, unknown>>,
    execute(input) {
      const r = evaluateAcrTirads(input as TiradsAcrInput);
      return {
        ok: true,
        engineVersion: r.engineVersion,
        sourceLabel: "@repo/tirads-acr · evaluateAcrTirads",
        categoryLabel: `ACR TI-RADS ${r.category}`,
        result: r as unknown as Record<string, unknown>,
        disclaimer: CDS,
      };
    },
    evidenceQuery: (label) => `${label} показания к ТАБ узла щитовидной железы`,
  },
  musa_adenomyosis: {
    engineId: "musa_adenomyosis",
    label: "MUSA adenomyosis (Sonogyn Score)",
    anatomies: MUSA_ADENOMYOSIS_SPEC.anatomies,
    toInput: (obs, ctx) => toMusaAdenomyosisInput(obs, { subjectId: ctx.subjectId }) as ToEngineResult<Record<string, unknown>>,
    execute(input) {
      const r = calculateAdenomyosisScore(input as MusaAdenomyosisAssessmentInput);
      const version = String((MUSA_ADENOMYOSIS_KNOWLEDGE as { version?: string }).version ?? "unknown");
      return {
        ok: true,
        engineVersion: `musa-adenomyosis ${version}`,
        sourceLabel: "@repo/musa-framework · calculateAdenomyosisScore",
        categoryLabel: `Sonogyn Score ${r.total}/${r.maxScore} · ${r.labelRu}`,
        result: r as unknown as Record<string, unknown>,
        disclaimer: `${CDS} Sonogyn Score — образовательная шкала, не официальная классификация MUSA.`,
      };
    },
    evidenceQuery: () => "MUSA аденомиоз ультразвуковые признаки",
  },
};

export function isSupportedEngine(engineId: string): engineId is MiEngineId {
  return Object.prototype.hasOwnProperty.call(ENGINE_ROUTES, engineId);
}
