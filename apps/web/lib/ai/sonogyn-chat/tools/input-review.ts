/**
 * Provenance of every tool input. A value proposed by the model never becomes a confirmed clinical input on
 * its own: model-assumed fields are excluded from the calculation, and review-gated tools withhold the result
 * until a physician confirms the fields.
 */

export type InputFieldState =
  /** Passed by the model (read from the conversation, not verified). */
  | "model_supplied"
  /** Declared by the model as inferred; excluded from the calculation until confirmed. */
  | "model_assumed"
  /** Confirmed by the physician in the review card. */
  | "physician_confirmed"
  /** Explicitly reported as not assessed; never read as a negative finding. */
  | "not_assessed";

export type InputFieldReview = {
  field: string;
  value: unknown;
  source: "model" | "physician";
  state: InputFieldState;
  usedInCalculation: boolean;
};

export type InputReview = {
  fields: InputFieldReview[];
  assumed: string[];
  notAssessed: string[];
  confirmed: string[];
  /** Fields used in the calculation without physician confirmation. */
  unconfirmed: string[];
  /** Concrete values present in an earlier call of this turn and dropped or changed by the retry. */
  changedAfterRejection?: string[];
};

export type ReviewState = {
  required: boolean;
  state: "pending" | "confirmed" | "not_required";
};

/** Tools whose result is shown only after physician confirmation of the inputs (TASK 05.4). */
export const REVIEW_GATED_TOOLS = ["calculate_orads", "calculate_adnex", "calculate_lr2", "calculate_srrisk"] as const;

export function isReviewGated(tool: string): boolean {
  return (REVIEW_GATED_TOOLS as readonly string[]).includes(tool);
}

export const INPUT_STATE_LABELS: Record<InputFieldState, string> = {
  model_supplied: "передано моделью — не подтверждено",
  model_assumed: "предположено моделью — в расчёт не включено",
  physician_confirmed: "подтверждено врачом",
  not_assessed: "не оценено",
};

export function buildInputReview(params: {
  input: Record<string, unknown>;
  assumed: readonly string[];
  notAssessed: readonly string[];
  confirmed?: readonly string[];
}): InputReview {
  const confirmed = new Set(params.confirmed ?? []);
  const assumed = new Set(params.assumed);
  const notAssessed = new Set(params.notAssessed);
  const fields: InputFieldReview[] = Object.entries(params.input).map(([field, value]) => {
    if (notAssessed.has(field)) {
      return { field, value, source: confirmed.has(field) ? "physician" : "model", state: "not_assessed", usedInCalculation: false };
    }
    if (confirmed.has(field)) {
      return { field, value, source: "physician", state: "physician_confirmed", usedInCalculation: true };
    }
    if (assumed.has(field)) {
      return { field, value, source: "model", state: "model_assumed", usedInCalculation: false };
    }
    return { field, value, source: "model", state: "model_supplied", usedInCalculation: true };
  });
  return {
    fields,
    assumed: fields.filter((f) => f.state === "model_assumed").map((f) => f.field),
    notAssessed: fields.filter((f) => f.state === "not_assessed").map((f) => f.field),
    confirmed: fields.filter((f) => f.state === "physician_confirmed").map((f) => f.field),
    unconfirmed: fields.filter((f) => f.state === "model_supplied").map((f) => f.field),
  };
}
