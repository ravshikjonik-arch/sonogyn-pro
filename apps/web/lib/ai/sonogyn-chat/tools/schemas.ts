import { z } from "zod";

import { biradsOptions, type BiradsInput } from "@repo/birads-us";
import type { FirstTrimesterScreeningInput } from "@repo/fmf";
import type { AdnexInput, Lr2Input, SimpleRulesRiskInput } from "@repo/iota-models";
import type { OradsInput } from "@repo/orads-us/pro";
import {
  COMPOSITION_OPTIONS,
  ECHOGENIC_FOCI_OPTIONS,
  ECHOGENICITY_OPTIONS,
  MARGIN_OPTIONS,
  SHAPE_OPTIONS,
  type LexiconOption,
  type TiradsAcrInput,
} from "@repo/tirads-acr";

import type { CompletenessStatus, ToolCompleteness } from "./completeness";
import type { InputReview, ReviewState } from "./input-review";

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

/**
 * One meaning for every tool: "not_assessed" = the finding was not evaluated (never a negative finding).
 * Categorical / boolean findings accept it; numeric measurements are simply omitted when not measured.
 */
export const NOT_ASSESSED = "not_assessed" as const;

/** Tool-only fields that are never forwarded to an engine. */
export const META_FIELDS = ["assumedFields"] as const;

const NA = z.literal(NOT_ASSESSED);
const NA_HINT = `Use "${NOT_ASSESSED}" (or omit) if not evaluated; never guess.`;

const mm = () => z.number().finite().positive();

function naEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.enum([NOT_ASSESSED, ...values] as unknown as [typeof NOT_ASSESSED, ...T]);
}

const naBool = () => z.union([z.boolean(), NA]);

function lexiconEnum<T extends string>(options: readonly LexiconOption<T>[]) {
  return z.enum(options.map((o) => o.value) as [T, ...T[]]);
}

function lexiconEnumOrNotAssessed<T extends string>(options: readonly LexiconOption<T>[]) {
  return z.enum([NOT_ASSESSED, ...options.map((o) => o.value)] as [typeof NOT_ASSESSED, ...T[]]);
}

export function biradsOptionValues(key: string): string[] {
  const values = (biradsOptions[key] ?? []).map((o) => o.value);
  if (values.length === 0) throw new Error(`BI-RADS ruleset has no options for '${key}'`);
  return values;
}

function biradsEnum(key: string) {
  return z.enum(biradsOptionValues(key) as [string, ...string[]]);
}

function biradsEnumOrNotAssessed(key: string) {
  return z.enum([NOT_ASSESSED, ...biradsOptionValues(key)] as [string, ...string[]]).describe(NA_HINT);
}

const ASSUMED_FIELDS = z
  .array(z.string().max(60))
  .max(40)
  .describe(
    "Names of fields whose values you inferred instead of reading them in the user's text. They are not used in the calculation until a physician confirms them.",
  )
  .optional();

/** Every O-RADS Pro input except free-text `customDescription` (not used by the calculation). */
export const OradsToolInputSchema = z
  .object({
    localization: naEnum(["ovarian", "extraovarian"]).optional(),
    ovarySide: naEnum(["left", "right", "bilateral"]).optional(),
    ageYears: z.number().int().min(10).max(100).optional(),
    cycleDay: z.number().int().min(1).max(35).optional(),
    menopause: naEnum(["pre", "post"]).optional(),
    lesionKind: naEnum(["physiological", "nonphysiological", "normal_ovary"])
      .describe(
        "Required for a category. nonphysiological = any cyst or mass other than a follicle / corpus luteum (physiological) or a normal ovary.",
      )
      .optional(),
    physiologicalType: naEnum(["follicle", "corpus_luteum"]).optional(),
    normalOvaryPattern: naEnum(["multifollicular", "typical"]).optional(),
    structure: naEnum(["unilocular", "multilocular", "solid"]).optional(),
    unilocularSubtype: naEnum([
      "simple_cyst",
      "hemorrhagic",
      "endometrioma",
      "dermoid",
      "paraovarian",
      "peritoneal_inclusion",
      "hydrosalpinx",
      "other",
    ]).optional(),
    septaCount: naEnum(["0", "1-3", ">3"]).optional(),
    septaThickness: naEnum(["thin", "thick"]).optional(),
    solidComponent: naBool().describe(`Solid component present. ${NA_HINT}`).optional(),
    solidType: naEnum(["smooth", "irregular", "papillary"])
      .describe(
        `Cyst without solid component: inner wall contour; solid lesion: outer contour; papillary: papillary projections. ${NA_HINT}`,
      )
      .optional(),
    echogenicity: naEnum(["anechoic", "hypo", "iso", "hyper"]).optional(),
    lengthMm: mm().optional(),
    widthMm: mm().optional(),
    heightMm: mm().optional(),
    ascites: naBool().describe(NA_HINT).optional(),
    bloodFlow: naEnum(["none", "minimal", "moderate", "marked"]).optional(),
    peritonealNodules: naBool().describe(NA_HINT).optional(),
    iotaLesionType: naEnum([
      "unilocular_cyst",
      "unilocular_solid_cyst",
      "multilocular_cyst",
      "multilocular_solid_cyst",
      "solid_tumor",
      "not_classifiable",
    ]).optional(),
    papillaryProjectionCount: naEnum(["0", "1", "2", "3", "4plus"]).optional(),
    papillaryProjectionSurface: naEnum(["smooth", "irregular"]).optional(),
    largestSolidDiameterMm: z.number().finite().min(0).optional(),
    cystLoculesOver10: naBool().optional(),
    acousticShadows: naBool().describe(NA_HINT).optional(),
    iotaColorScore: naEnum(["1", "2", "3", "4"])
      .describe("Color score 1–4 (O-RADS US v2022 / IOTA), string value")
      .optional(),
    iotaCenterType: naEnum(["oncology", "other"]).optional(),
    incompleteSeptum: naBool().optional(),
    assumedFields: ASSUMED_FIELDS,
  })
  .strict();

export const BiradsToolInputSchema = z
  .object({
    findingType: biradsEnum("findingType"),
    shape: biradsEnumOrNotAssessed("shape"),
    margin: biradsEnumOrNotAssessed("margin"),
    echoPattern: biradsEnumOrNotAssessed("echoPattern"),
    vascularity: biradsEnumOrNotAssessed("vascularity"),
    orientation: biradsEnumOrNotAssessed("orientation"),
    posteriorFeatures: biradsEnumOrNotAssessed("posteriorFeatures"),
    nonMassEchogenicity: biradsEnum("nonMassEchogenicity").optional(),
    nonMassDistribution: biradsEnum("nonMassDistribution").optional(),
    nonMassAssociatedFeatures: biradsEnum("nonMassAssociatedFeatures").optional(),
    assumedFields: ASSUMED_FIELDS,
  })
  .strict();

/** Classification fields of the ACR TI-RADS engine; protocol-only fields are not accepted. */
export const TiradsToolInputSchema = z
  .object({
    composition: lexiconEnumOrNotAssessed(COMPOSITION_OPTIONS),
    echogenicity: lexiconEnumOrNotAssessed(ECHOGENICITY_OPTIONS),
    shape: lexiconEnumOrNotAssessed(SHAPE_OPTIONS),
    margin: lexiconEnumOrNotAssessed(MARGIN_OPTIONS),
    echogenicFoci: z
      .union([
        z.array(lexiconEnum(ECHOGENIC_FOCI_OPTIONS)).min(1).max(ECHOGENIC_FOCI_OPTIONS.length),
        NA,
      ])
      .describe(`Array of all that apply, or "${NOT_ASSESSED}".`),
    largestDiameterMm: mm().describe("Largest nodule diameter, mm. Omit if not measured.").optional(),
    /** @deprecated Former tool field name; same quantity in mm, forwarded as `largestDiameterMm`. */
    maxDiameterMm: mm().describe("Deprecated alias of largestDiameterMm, mm").optional(),
    lymphNodes: z.enum([NOT_ASSESSED, "benign", "indeterminate", "suspicious"]).optional(),
    assumedFields: ASSUMED_FIELDS,
  })
  .strict();

export const FmfScreeningToolInputSchema = z
  .object({
    gaDays: z.number().int().positive().optional(),
    gaWeeks: z.number().int().positive().optional(),
    msdMm: mm().optional(),
    priorMsdMm: mm().optional(),
    priorMsdGaDays: z.number().int().positive().optional(),
    ysdMm: mm().optional(),
    crlMm: mm().optional(),
    priorCrlMm: mm().optional(),
    priorCrlGaDays: z.number().int().positive().optional(),
    ntMm: mm().optional(),
    nasalBone: naEnum(["present", "absent", "hypoplastic", "uncertain", "seen", "not_seen"]).optional(),
    dvPi: z.number().finite().positive().optional(),
    dvAWave: naEnum(["positive", "absent", "reversed"]).optional(),
    tricuspidVelocityCmS: z.number().finite().positive().optional(),
    tricuspidDurationFraction: z.number().finite().min(0).max(1).optional(),
    tricuspidRegurg: naEnum(["none", "present", "unknown"]).optional(),
    fhrBpm: z.number().finite().positive().optional(),
    uterinePiLeft: z.number().finite().positive().optional(),
    uterinePiRight: z.number().finite().positive().optional(),
    sbpMmHg: z.number().finite().positive().optional(),
    dbpMmHg: z.number().finite().positive().optional(),
    assumedFields: ASSUMED_FIELDS,
  })
  .strict();

const IotaPapillaryCountSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal("4plus"),
  NA,
]);

const OradsCategorySchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

const SimpleRulesFeatureSchema = z.enum(["B1", "B2", "B3", "B4", "B5", "M1", "M2", "M3", "M4", "M5"]);

const IOTA_REQUIRED = `Required by the model; "${NOT_ASSESSED}" if not evaluated — never guess.`;
const ONCOLOGY_CENTER = `Examination performed in an oncology referral centre; "${NOT_ASSESSED}" if unknown.`;

export const AdnexToolInputSchema = z
  .object({
    ageYears: z.number().int().min(18).max(100),
    oncologyCenter: naBool().describe(ONCOLOGY_CENTER),
    maxDiameterMm: z.number().finite().min(8).max(400),
    maxSolidDiameterMm: z.number().finite().min(0).max(400).describe("0 = no solid tissue. Required measurement."),
    moreThan10Locules: naBool().describe(IOTA_REQUIRED),
    papillaryCount: IotaPapillaryCountSchema.describe(IOTA_REQUIRED),
    acousticShadows: naBool().describe(IOTA_REQUIRED),
    ascites: naBool().describe(IOTA_REQUIRED),
    ca125Uml: z.number().finite().min(1).max(30000).describe("Omit if not measured (model without CA-125).").optional(),
    oradsCategory: OradsCategorySchema.optional(),
    assumedFields: ASSUMED_FIELDS,
  })
  .strict();

export const Lr2ToolInputSchema = z
  .object({
    ageYears: z.number().int().min(18).max(100),
    ascites: naBool().describe(IOTA_REQUIRED),
    bloodFlowInSolidPapillary: naBool().describe(`false if there is no solid tissue. ${IOTA_REQUIRED}`),
    maxSolidDiameterMm: z.number().finite().min(0).max(400).describe("0 = no solid tissue. Required measurement."),
    irregularInternalWalls: naBool().describe(IOTA_REQUIRED),
    acousticShadows: naBool().describe(IOTA_REQUIRED),
    assumedFields: ASSUMED_FIELDS,
  })
  .strict();

/** Both lists are required: an empty list means "assessed, none present", never "not provided". */
export const SimpleRulesRiskToolInputSchema = z
  .object({
    oncologyCenter: naBool().describe(ONCOLOGY_CENTER),
    benignFeatures: z.array(z.enum(["B1", "B2", "B3", "B4", "B5"])).describe("Features assessed and present."),
    malignantFeatures: z.array(z.enum(["M1", "M2", "M3", "M4", "M5"])).describe("Features assessed and present."),
    notAssessedFeatures: z
      .array(SimpleRulesFeatureSchema)
      .describe("Features that could not be assessed; a code listed nowhere means assessed and absent.")
      .optional(),
    oradsCategory: OradsCategorySchema.optional(),
    assumedFields: ASSUMED_FIELDS,
  })
  .strict();

type OradsToolInput = z.infer<typeof OradsToolInputSchema>;
type TiradsToolInput = z.infer<typeof TiradsToolInputSchema>;

const known = (v: unknown) => v !== undefined && v !== NOT_ASSESSED;

function hasPapillaryFinding(v: OradsToolInput): boolean {
  return (
    v.solidType === "papillary" ||
    (known(v.papillaryProjectionCount) && v.papillaryProjectionCount !== "0") ||
    known(v.papillaryProjectionSurface)
  );
}

/** Papillary projections are solid tissue; the engine reads them only with `solidComponent: true`. */
function checkOradsConsistency(v: OradsToolInput, ctx: z.RefinementCtx): void {
  if (hasPapillaryFinding(v) && v.solidComponent !== true) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["solidComponent"],
      message:
        v.solidComponent === false
          ? "противоречие: указаны папиллярные разрастания при solidComponent=false — уточните морфологию"
          : "указаны папиллярные разрастания — укажите solidComponent=true явно",
    });
  }
}

function checkTiradsConsistency(v: TiradsToolInput, ctx: z.RefinementCtx): void {
  if (
    v.largestDiameterMm !== undefined &&
    v.maxDiameterMm !== undefined &&
    v.largestDiameterMm !== v.maxDiameterMm
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["largestDiameterMm"],
      message: "указаны два разных размера (largestDiameterMm и maxDiameterMm) — оставьте один",
    });
  }
}

function checkSimpleRulesConsistency(v: z.infer<typeof SimpleRulesRiskToolInputSchema>, ctx: z.RefinementCtx): void {
  const present = new Set<string>([...v.benignFeatures, ...v.malignantFeatures]);
  const overlap = (v.notAssessedFeatures ?? []).filter((f) => present.has(f));
  if (overlap.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["notAssessedFeatures"],
      message: `противоречие: ${overlap.join(", ")} указаны и как присутствующие, и как неоценённые`,
    });
  }
}

/** `assumedFields` may only name fields that are present in the same call. */
function checkAssumedFields(v: Record<string, unknown>, ctx: z.RefinementCtx): void {
  for (const field of (v.assumedFields as string[] | undefined) ?? []) {
    if (!(field in v) || (META_FIELDS as readonly string[]).includes(field)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assumedFields"],
        message: `«${field.slice(0, 40)}» не передано в этом вызове`,
      });
    }
  }
}

function validator<S extends z.ZodTypeAny>(schema: S, check?: (v: z.infer<S>, ctx: z.RefinementCtx) => void) {
  return schema.superRefine((v, ctx) => {
    checkAssumedFields(v as Record<string, unknown>, ctx);
    check?.(v, ctx);
  });
}

export const TOOL_INPUT_SCHEMAS: Record<AllowedAiToolName, z.AnyZodObject> = {
  calculate_orads: OradsToolInputSchema,
  calculate_birads: BiradsToolInputSchema,
  calculate_tirads: TiradsToolInputSchema,
  calculate_adnex: AdnexToolInputSchema,
  calculate_lr2: Lr2ToolInputSchema,
  calculate_srrisk: SimpleRulesRiskToolInputSchema,
  assess_fmf_screening: FmfScreeningToolInputSchema,
};

const TOOL_VALIDATORS: Record<AllowedAiToolName, z.ZodTypeAny> = {
  calculate_orads: validator(OradsToolInputSchema, checkOradsConsistency),
  calculate_birads: validator(BiradsToolInputSchema),
  calculate_tirads: validator(TiradsToolInputSchema, checkTiradsConsistency),
  calculate_adnex: validator(AdnexToolInputSchema),
  calculate_lr2: validator(Lr2ToolInputSchema),
  calculate_srrisk: validator(SimpleRulesRiskToolInputSchema, checkSimpleRulesConsistency),
  assess_fmf_screening: validator(FmfScreeningToolInputSchema),
};

export const ToolCallRequestSchema = z.object({
  tool: z.enum(ALLOWED_AI_TOOLS),
  input: z.record(z.unknown()),
});

export type ValidationIssue = { path: string; message: string };

export type ToolExecutionResult = {
  tool: AllowedAiToolName;
  ok: boolean;
  engineVersion: string;
  sourceLabel: string;
  /** Raw input as received (kept for compatibility); provenance lives in `inputReview`. */
  inputEcho: Record<string, unknown>;
  result?: Record<string, unknown>;
  /** Worst section status; absent on results stored before TASK 05.2. */
  status?: CompletenessStatus;
  completeness?: ToolCompleteness;
  missingFields?: string[];
  /** Engine-read fields absent from the input that the engine evaluates as "absent / no". */
  notProvided?: string[];
  limitations?: string[];
  error?: string;
  /** The call was rejected before any engine ran (validation or retry integrity). */
  rejected?: boolean;
  validationIssues?: ValidationIssue[];
  inputReview?: InputReview;
  review?: ReviewState;
};

const MAX_ECHOED_VALUE = 40;

function distinctStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function issueMessage(issue: z.ZodIssue): string {
  if (issue.code === z.ZodIssueCode.invalid_type && issue.received === "undefined") return "обязательное поле";
  if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    const received = String(issue.received).slice(0, MAX_ECHOED_VALUE);
    return `недопустимое значение «${received}»; допустимо: ${issue.options.join(", ")}`;
  }
  return issue.message;
}

function flattenIssues(issues: readonly z.ZodIssue[]): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  for (const issue of issues) {
    if (issue.code === z.ZodIssueCode.unrecognized_keys) {
      out.push(...issue.keys.map((k) => ({ path: [...issue.path, k].join("."), message: "неизвестное поле" })));
      continue;
    }
    if (issue.code === z.ZodIssueCode.invalid_union) {
      const nested = issue.unionErrors.flatMap((e) => e.issues);
      const literalOption = nested.some((i) => i.code === z.ZodIssueCode.invalid_literal && i.expected === NOT_ASSESSED);
      const details = flattenIssues(nested.filter((i) => i.code !== z.ZodIssueCode.invalid_literal));
      if (details.length) {
        out.push(
          ...details.map((d) => ({ ...d, message: literalOption ? `${d.message} (либо "${NOT_ASSESSED}")` : d.message })),
        );
        continue;
      }
    }
    out.push({ path: issue.path.join(".") || "input", message: issueMessage(issue) });
  }
  const seen = new Set<string>();
  return out.filter((i) => {
    const key = `${i.path}|${i.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatValidationIssues(issues: readonly ValidationIssue[]): string {
  return `Некорректные входные данные: ${distinctStrings(
    issues.map((i) => (i.path === "input" ? i.message : `${i.path}: ${i.message}`)),
  ).join("; ")}`;
}

export function validateToolCall(
  tool: string,
  input: unknown,
):
  | { ok: true; tool: AllowedAiToolName; parsed: Record<string, unknown> }
  | { ok: false; error: string; issues: ValidationIssue[] } {
  if (!ALLOWED_AI_TOOLS.includes(tool as AllowedAiToolName)) {
    const issues = [{ path: "tool", message: `Tool '${String(tool).slice(0, MAX_ECHOED_VALUE)}' is not allowed` }];
    return { ok: false, error: issues[0]!.message, issues };
  }
  const name = tool as AllowedAiToolName;
  const parsed = TOOL_VALIDATORS[name].safeParse(input);
  if (!parsed.success) {
    const issues = flattenIssues(parsed.error.issues);
    return { ok: false, error: formatValidationIssues(issues), issues };
  }
  return { ok: true, tool: name, parsed: parsed.data as Record<string, unknown> };
}

/* Compile-time contract checks: tool schemas must cover exactly the engine inputs they forward. */
type Assert<T extends true> = T;
type SameKeys<A, B> = [Exclude<A, B>, Exclude<B, A>] extends [never, never] ? true : false;
type Fits<A, B> = A extends B ? true : false;
type Meta = (typeof META_FIELDS)[number];
/** Tool-side `not_assessed` is resolved before the engine call. */
type Assessed<T> = { [K in keyof T]: Exclude<T[K], typeof NOT_ASSESSED> };
type EngineSide<T, Extra extends PropertyKey = never> = Assessed<Omit<T, Meta | Extra>>;

type TiradsProtocolOnlyField =
  | "thyroidVolumeMl"
  | "parenchymaEchogenicity"
  | "parenchymaVascularity"
  | "noduleLocation"
  | "patternId";

type AdnexTool = z.infer<typeof AdnexToolInputSchema>;
type Lr2Tool = z.infer<typeof Lr2ToolInputSchema>;
type SrrTool = z.infer<typeof SimpleRulesRiskToolInputSchema>;
type FmfTool = z.infer<typeof FmfScreeningToolInputSchema>;
type BiradsTool = z.infer<typeof BiradsToolInputSchema>;

export type ToolSchemaContractChecks = [
  Assert<SameKeys<keyof EngineSide<OradsToolInput>, Exclude<keyof OradsInput, "customDescription">>>,
  Assert<Fits<EngineSide<OradsToolInput>, OradsInput>>,
  Assert<SameKeys<keyof EngineSide<BiradsTool>, keyof BiradsInput>>,
  Assert<Fits<EngineSide<BiradsTool>, BiradsInput>>,
  Assert<SameKeys<keyof EngineSide<TiradsToolInput, "maxDiameterMm">, Exclude<keyof TiradsAcrInput, TiradsProtocolOnlyField>>>,
  Assert<Fits<EngineSide<TiradsToolInput, "maxDiameterMm">, TiradsAcrInput>>,
  Assert<SameKeys<keyof EngineSide<AdnexTool, "oradsCategory">, keyof AdnexInput>>,
  Assert<Fits<EngineSide<AdnexTool, "oradsCategory">, AdnexInput>>,
  Assert<SameKeys<keyof EngineSide<Lr2Tool>, keyof Lr2Input>>,
  Assert<Fits<EngineSide<Lr2Tool>, Lr2Input>>,
  Assert<SameKeys<keyof EngineSide<SrrTool, "oradsCategory" | "notAssessedFeatures">, keyof SimpleRulesRiskInput>>,
  Assert<Fits<EngineSide<SrrTool, "oradsCategory" | "notAssessedFeatures">, SimpleRulesRiskInput>>,
  Assert<SameKeys<keyof EngineSide<FmfTool>, keyof FirstTrimesterScreeningInput>>,
  Assert<Fits<EngineSide<FmfTool>, FirstTrimesterScreeningInput>>,
];
