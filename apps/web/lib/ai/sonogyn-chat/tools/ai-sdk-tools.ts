import { jsonSchema, tool, zodSchema } from "ai";
import type { z } from "zod";

import { createChatToolSession, type ChatToolSession } from "./chat-tool-session";
import { TOOL_INPUT_SCHEMAS, type AllowedAiToolName } from "./schemas";

/** Shared result contract shown to the model for every clinical tool. */
const RESULT_CONTRACT = [
  "Result fields: ok, status (complete | provisional | incomplete), completeness.category / completeness.recommendation, missingFields, limitations, error, rejected, validationIssues, review.",
  "If ok=false or a section is incomplete, do not state that value; ask the user only for the fields in missingFields / validationIssues / completeness.",
  "If rejected=true, fix only the fields listed in validationIssues and keep every other value exactly as the user gave it.",
  "If review.state=pending, do not state, estimate or paraphrase any result: ask the physician to confirm the inputs in the tool card.",
  "Report provisional values as provisional together with limitations.",
  'Never guess findings: use "not_assessed" (or omit) for anything the user did not state; list inferred values in assumedFields.',
  "Call the tool with the data already given before asking questions; do not ask for data the user already provided or that the tool does not need.",
].join(" ");

const DESCRIPTIONS: Record<AllowedAiToolName, string> = {
  calculate_orads:
    "Calculate O-RADS US category from structured ultrasound descriptors (local SSOT engine). Ovary side and cycle day are not needed for the category.",
  calculate_birads: "Calculate BI-RADS US category from mass descriptors (local rules engine).",
  calculate_tirads:
    "Calculate ACR TI-RADS category from nodule descriptors (local engine); FNA/follow-up has its own completeness status.",
  calculate_adnex:
    "IOTA ADNEX model: malignancy probability from structured adnexal ultrasound (+ optional CA-125). Optional oradsCategory for 10% threshold compare.",
  calculate_lr2: "IOTA LR2 logistic model for ovarian malignancy risk from ultrasound features.",
  calculate_srrisk:
    "IOTA Simple Rules Risk (AJOG 2016): malignancy probability from B/M feature codes. List features that could not be assessed in notAssessedFeatures. Optional oradsCategory for compare.",
  assess_fmf_screening:
    "Assess first-trimester FMF-compatible percentiles (CRL, NT, MAP and other markers) with the local percentile engine.",
};

/**
 * The model sees the full JSON Schema, but the SDK does not reject calls: validation runs in
 * `executeClinicalTool`, which returns a structured `rejected` result the model can act on and the card can show.
 */
function passThroughSchema(schema: z.AnyZodObject) {
  return jsonSchema<Record<string, unknown>>(() => zodSchema(schema).jsonSchema, {
    validate: (value) => ({ success: true, value: value as Record<string, unknown> }),
  });
}

/** Vercel AI SDK tool definitions for one chat turn — execute stays server-side only. */
export function createSonogynClinicalTools(session: ChatToolSession = createChatToolSession()) {
  const make = (name: AllowedAiToolName) =>
    tool({
      description: `${DESCRIPTIONS[name]} ${RESULT_CONTRACT}`,
      inputSchema: passThroughSchema(TOOL_INPUT_SCHEMAS[name]),
      execute: async (input) => session.call(name, input),
    });
  return {
    calculate_orads: make("calculate_orads"),
    calculate_birads: make("calculate_birads"),
    calculate_tirads: make("calculate_tirads"),
    calculate_adnex: make("calculate_adnex"),
    calculate_lr2: make("calculate_lr2"),
    calculate_srrisk: make("calculate_srrisk"),
    assess_fmf_screening: make("assess_fmf_screening"),
  };
}
