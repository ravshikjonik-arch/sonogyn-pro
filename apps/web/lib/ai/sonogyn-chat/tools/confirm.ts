import { z } from "zod";

import { executeClinicalTool } from "./execute";
import { REVIEW_GATED_TOOLS } from "./input-review";
import { META_FIELDS, type ToolExecutionResult } from "./schemas";

/**
 * Physician review of a gated tool call. Only fields the physician ticked are used; every other field is dropped
 * (treated as not provided) — nothing the model proposed enters the calculation unconfirmed.
 */
export const ConfirmToolRequestSchema = z
  .object({
    tool: z.enum(REVIEW_GATED_TOOLS),
    input: z.record(z.unknown()).refine((v) => Object.keys(v).length <= 60, "too many fields"),
    confirmedFields: z.array(z.string().max(60)).max(60),
  })
  .strict();

export type ConfirmToolRequest = z.infer<typeof ConfirmToolRequestSchema>;

export function confirmClinicalToolInputs(request: ConfirmToolRequest): ToolExecutionResult {
  const meta = META_FIELDS as readonly string[];
  const confirmed = [...new Set(request.confirmedFields)].filter((f) => f in request.input && !meta.includes(f));
  const input = Object.fromEntries(Object.entries(request.input).filter(([k]) => confirmed.includes(k)));
  return executeClinicalTool(request.tool, input, { confirmedFields: confirmed });
}
