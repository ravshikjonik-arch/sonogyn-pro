import type { TiradsAcrInput, TiradsAcrResult } from "@repo/tirads-acr";
import { z } from "zod";

export const SRE_TIRADS_BRIDGE_KEY = "sonogyn:sre-tirads-bridge-v1";

const TiradsEchogenicFociSchema = z.enum([
  "none_or_comet_tail",
  "macrocalcifications",
  "peripheral_rim",
  "punctate",
]);

const TiradsAcrInputSchema = z.object({
  composition: z.enum(["no_nodule", "cystic", "spongiform", "mixed", "solid"]),
  echogenicity: z.enum(["anechoic", "hyperechoic_or_isoechoic", "hypoechoic", "very_hypoechoic"]),
  shape: z.enum(["wider_than_tall", "taller_than_wide"]),
  margin: z.enum(["smooth", "ill_defined", "lobulated_or_irregular", "extrathyroidal_extension"]),
  echogenicFoci: z.array(TiradsEchogenicFociSchema).min(1).max(4),
  largestDiameterMm: z.number().finite().positive().max(200).optional(),
  thyroidVolumeMl: z.number().finite().nonnegative().max(500).optional(),
  parenchymaEchogenicity: z.string().max(200).optional(),
  parenchymaVascularity: z.string().max(200).optional(),
  noduleLocation: z.string().max(200).optional(),
  lymphNodes: z.enum(["not_assessed", "benign", "indeterminate", "suspicious"]).optional(),
  patternId: z.string().max(80).optional(),
});

const TiradsAcrResultSchema = z
  .object({
    category: z.enum(["TR1", "TR2", "TR3", "TR4", "TR5"]),
    categoryLabel: z.string().max(120),
    totalPoints: z.number().int().min(0).max(30),
    malignancyRisk: z.string().max(40),
    fnaRecommended: z.boolean(),
    fnaRationale: z.string().max(2000),
    followUpRecommendation: z.string().max(2000),
    engineVersion: z.string().max(40).optional(),
  })
  .passthrough();

const SreTiradsBridgePayloadSchema = z.object({
  input: TiradsAcrInputSchema,
  result: TiradsAcrResultSchema,
  savedAt: z.string().min(1).max(64),
});

export type SreTiradsBridgePayload = {
  input: TiradsAcrInput;
  result: Pick<
    TiradsAcrResult,
    | "category"
    | "categoryLabel"
    | "totalPoints"
    | "malignancyRisk"
    | "fnaRecommended"
    | "fnaRationale"
    | "followUpRecommendation"
    | "engineVersion"
  >;
  savedAt: string;
};

export function saveTiradsBridgePayload(
  payload: Omit<SreTiradsBridgePayload, "savedAt">,
): void {
  if (typeof window === "undefined") return;
  const data: SreTiradsBridgePayload = { ...payload, savedAt: new Date().toISOString() };
  const parsed = SreTiradsBridgePayloadSchema.safeParse(data);
  if (!parsed.success) {
    console.warn("[sre-tirads-bridge] invalid payload", parsed.error.flatten());
    return;
  }
  sessionStorage.setItem(SRE_TIRADS_BRIDGE_KEY, JSON.stringify(parsed.data));
}

export function loadTiradsBridgePayload(): SreTiradsBridgePayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SRE_TIRADS_BRIDGE_KEY);
  if (!raw) return null;
  try {
    const parsed = SreTiradsBridgePayloadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as SreTiradsBridgePayload) : null;
  } catch {
    return null;
  }
}

export function clearTiradsBridgePayload(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SRE_TIRADS_BRIDGE_KEY);
}
