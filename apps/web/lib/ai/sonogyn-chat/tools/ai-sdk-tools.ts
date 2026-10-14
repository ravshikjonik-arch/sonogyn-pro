import { tool } from "ai";

import { executeClinicalTool } from "./execute";
import {
  BiradsToolInputSchema,
  FmfScreeningToolInputSchema,
  OradsToolInputSchema,
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
  assess_fmf_screening: tool({
    description:
      "Assess first-trimester FMF-compatible percentiles (CRL, NT, MAP). Returns measurements from local percentile engine only.",
    inputSchema: FmfScreeningToolInputSchema,
    execute: async (input) => executeClinicalTool("assess_fmf_screening", input),
  }),
};
