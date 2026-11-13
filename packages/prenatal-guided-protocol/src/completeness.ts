import type { GuidedFields } from "./fields";
import type { GuidedStep } from "./types";

function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "number") return Number.isFinite(value) && !Number.isNaN(value);
  if (typeof value === "string") return value.trim().length > 0;
  return false;
}

export type CompletenessResult = {
  percent: number;
  requiredTotal: number;
  requiredDone: number;
  stepStatus: Array<{
    stepId: string;
    required: boolean;
    done: boolean;
    filledFields: number;
    totalFields: number;
  }>;
};

/** Step is done when all its fieldKeys that exist on values are filled, or look/red_flag with no fields marked via optional override. */
export function completeness(
  values: GuidedFields,
  steps: GuidedStep[],
  opts?: { completedStepIds?: string[] },
): CompletenessResult {
  const completed = new Set(opts?.completedStepIds ?? []);
  const bag = values as Record<string, unknown>;
  const stepStatus = steps.map((step) => {
    const keys = step.fieldKeys;
    if (keys.length === 0) {
      const done = completed.has(step.id);
      return {
        stepId: step.id,
        required: step.required,
        done,
        filledFields: done ? 1 : 0,
        totalFields: 1,
      };
    }
    let filled = 0;
    for (const k of keys) {
      if (isFilled(bag[k])) filled += 1;
    }
    const done = filled === keys.length || (filled > 0 && !step.required && filled >= Math.ceil(keys.length / 2));
    // Required measure/look with fields: all keys filled
    const strictDone = keys.every((k) => isFilled(bag[k]));
    return {
      stepId: step.id,
      required: step.required,
      done: step.required ? strictDone : done || strictDone,
      filledFields: filled,
      totalFields: keys.length,
    };
  });

  const required = stepStatus.filter((s) => s.required);
  const requiredDone = required.filter((s) => s.done).length;
  const percent =
    required.length === 0 ? 100 : Math.round((requiredDone / required.length) * 100);

  return {
    percent,
    requiredTotal: required.length,
    requiredDone,
    stepStatus,
  };
}
