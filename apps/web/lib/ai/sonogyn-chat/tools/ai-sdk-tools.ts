import { tool } from "ai";

import { executeClinicalTool } from "./execute";
import {
  AdnexToolInputSchema,
  BiradsToolInputSchema,
  FmfScreeningToolInputSchema,
  Lr2ToolInputSchema,
  OradsToolInputSchema,
  SimpleRulesRiskToolInputSchema,
  TiradsToolInputSchema,
} from "./schemas";

/** Vercel AI SDK tool definitions — execute stays server-side only. */
export const sonogynClinicalTools = {
  calculate_orads: tool({
    description:
      "Calculate O-RADS US category from structured ultrasound descriptors. Returns numeric category from local engine only.",
    inputSchema: OradsToolInputSchema,
    execute: async (input) => executeClinicalTool("calculate_orads", input),
  }),
  calculate_birads: tool({
    description:
      "Calculate BI-RADS US category from mass descriptors. Returns category from local rules engine only.",
    inputSchema: BiradsToolInputSchema,
    execute: async (input) => executeClinicalTool("calculate_birads", input),
  }),
  calculate_tirads: tool({
    description:
      "Calculate ACR TI-RADS category from nodule descriptors. Returns points and category from local engine only.",
    inputSchema: TiradsToolInputSchema,
    execute: async (input) => executeClinicalTool("calculate_tirads", input),
  }),
  calculate_adnex: tool({
    description:
      "IOTA ADNEX model: malignancy probability from structured adnexal ultrasound (+ optional CA-125). Optional oradsCategory for 10% threshold compare.",
    inputSchema: AdnexToolInputSchema,
    execute: async (input) => executeClinicalTool("calculate_adnex", input),
  }),
  calculate_lr2: tool({
    description: "IOTA LR2 logistic model for ovarian malignancy risk from ultrasound features.",
    inputSchema: Lr2ToolInputSchema,
    execute: async (input) => executeClinicalTool("calculate_lr2", input),
  }),
  calculate_srrisk: tool({
    description:
      "IOTA Simple Rules Risk (AJOG 2016): malignancy probability from B/M feature codes. Optional oradsCategory for compare.",
    inputSchema: SimpleRulesRiskToolInputSchema,
    execute: async (input) => executeClinicalTool("calculate_srrisk", input),
  }),
  assess_fmf_screening: tool({
    description:
      "Assess first-trimester FMF-compatible percentiles (CRL, NT, MAP). Returns measurements from local percentile engine only.",
    inputSchema: FmfScreeningToolInputSchema,
    execute: async (input) => executeClinicalTool("assess_fmf_screening", input),
  }),
};
