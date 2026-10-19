import { z } from "zod";

/** Allowed server-side clinical calculator tools — ACL enforced in execute.ts */
export const ALLOWED_AI_TOOLS = [
  "calculate_orads",
  "calculate_birads",
  "calculate_tirads",
  "calculate_adnex",
  "calculate_lr2",
  "calculate_srrisk",
  "assess_fmf_screening",
] as const;

export type AllowedAiToolName = (typeof ALLOWED_AI_TOOLS)[number];

export const OradsToolInputSchema = z.object({
  menopause: z.enum(["pre", "post"]).optional(),
  lesionKind: z.enum(["physiological", "nonphysiological", "normal_ovary"]).optional(),
  structure: z.enum(["unilocular", "multilocular", "solid"]).optional(),
  solidComponent: z.boolean().optional(),
  lengthMm: z.number().positive().optional(),
  widthMm: z.number().positive().optional(),
  heightMm: z.number().positive().optional(),
  bloodFlow: z.enum(["none", "minimal", "moderate", "marked"]).optional(),
  ageYears: z.number().int().min(10).max(100).optional(),
});

export const BiradsToolInputSchema = z.object({
  findingType: z.enum(["mass", "non_mass"]).default("mass"),
  shape: z.string().min(1),
  margin: z.string().min(1),
  echoPattern: z.string().min(1),
  vascularity: z.string().min(1),
  orientation: z.string().min(1),
  posteriorFeatures: z.string().min(1),
});

export const TiradsToolInputSchema = z.object({
  composition: z.string().min(1),
  echogenicity: z.string().min(1),
  shape: z.string().min(1),
  margin: z.string().min(1),
  echogenicFoci: z.array(z.string()).min(1),
  maxDiameterMm: z.number().positive().optional(),
});

export const FmfScreeningToolInputSchema = z.object({
  crlMm: z.number().positive().optional(),
  ntMm: z.number().positive().optional(),
  sbpMmHg: z.number().positive().optional(),
  dbpMmHg: z.number().positive().optional(),
});

const IotaPapillaryCountSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal("4plus"),
]);

const SimpleRulesFeatureSchema = z.enum(["B1", "B2", "B3", "B4", "B5", "M1", "M2", "M3", "M4", "M5"]);

export const AdnexToolInputSchema = z.object({
  ageYears: z.number().int().min(18).max(100),
  oncologyCenter: z.boolean(),
  maxDiameterMm: z.number().min(8).max(400),
  maxSolidDiameterMm: z.number().min(0).max(400),
  moreThan10Locules: z.boolean(),
  papillaryCount: IotaPapillaryCountSchema,
  acousticShadows: z.boolean(),
  ascites: z.boolean(),
  ca125Uml: z.number().min(1).max(30000).optional(),
  oradsCategory: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
});

export const Lr2ToolInputSchema = z.object({
  ageYears: z.number().int().min(18).max(100),
  ascites: z.boolean(),
  bloodFlowInSolidPapillary: z.boolean(),
  maxSolidDiameterMm: z.number().min(0).max(400),
  irregularInternalWalls: z.boolean(),
  acousticShadows: z.boolean(),
});

export const SimpleRulesRiskToolInputSchema = z.object({
  oncologyCenter: z.boolean(),
  benignFeatures: z.array(SimpleRulesFeatureSchema).default([]),
  malignantFeatures: z.array(SimpleRulesFeatureSchema).default([]),
  oradsCategory: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
});

export const ToolCallRequestSchema = z.object({
  tool: z.enum(ALLOWED_AI_TOOLS),
  input: z.record(z.unknown()),
});

export type ToolExecutionResult = {
  tool: AllowedAiToolName;
  ok: boolean;
  engineVersion: string;
  sourceLabel: string;
  inputEcho: Record<string, unknown>;
  result?: Record<string, unknown>;
  missingFields?: string[];
  error?: string;
};

export function validateToolCall(
  tool: string,
  input: unknown,
): { ok: true; tool: AllowedAiToolName; parsed: Record<string, unknown> } | { ok: false; error: string } {
  if (!ALLOWED_AI_TOOLS.includes(tool as AllowedAiToolName)) {
    return { ok: false, error: `Tool '${tool}' is not allowed` };
  }
  const name = tool as AllowedAiToolName;
  const schema =
    name === "calculate_orads"
      ? OradsToolInputSchema
      : name === "calculate_birads"
        ? BiradsToolInputSchema
        : name === "calculate_tirads"
          ? TiradsToolInputSchema
          : name === "calculate_adnex"
            ? AdnexToolInputSchema
            : name === "calculate_lr2"
              ? Lr2ToolInputSchema
              : name === "calculate_srrisk"
                ? SimpleRulesRiskToolInputSchema
                : FmfScreeningToolInputSchema;

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.path.join(".")).join(", ") };
  }
  return { ok: true, tool: name, parsed: parsed.data as Record<string, unknown> };
}
