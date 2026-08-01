import type { AdnexTriangulation } from "@repo/adnex-education";
import type { OradsTreePathStep, OradsTreeResult } from "@repo/orads-us";
import { z } from "zod";

export const SRE_ORADS_WIZARD_BRIDGE_KEY = "sonogyn:sre-orads-wizard-bridge-v1";

const OradsTreePathStepSchema = z.object({
  nodeId: z.string().min(1).max(80),
  optionId: z.string().min(1).max(80),
});

const OradsTreeResultSchema = z.object({
  category: z.string().min(1).max(40),
  categoryNumber: z.number().int().min(0).max(5),
  riskPercent: z.string().min(1).max(40),
  managementKey: z.string().min(1).max(120),
  colorCode: z.enum(["slate", "sky", "emerald", "amber", "orange", "red"]),
  rationaleKey: z.string().max(120).optional(),
});

const AdnexTriangulationSchema = z
  .object({
    oradsCategory: z.number().int().min(0).max(5),
    iotaVerdict: z.enum(["benign", "malignant", "indeterminate"]),
    iotaBenign: z.array(z.string()).default([]),
    iotaMalignant: z.array(z.string()).default([]),
    agreement: z.enum(["full", "partial", "conflict"]),
    headline: z.string().max(500),
    managementRu: z.string().max(2000),
    protocolSnippet: z.string().max(4000).optional(),
    suggestedOradsNote: z.string().max(500).optional(),
    pitfalls: z.array(z.unknown()).optional(),
    guardrails: z.array(z.unknown()).optional(),
  })
  .passthrough();

const SreOradsWizardBridgePayloadSchema = z.object({
  path: z.array(OradsTreePathStepSchema).max(40),
  result: OradsTreeResultSchema,
  pathSummary: z.array(z.string().max(240)).max(40).default([]),
  triangulation: AdnexTriangulationSchema.optional(),
  savedAt: z.string().min(1).max(64),
});

export type SreOradsWizardBridgePayload = {
  path: OradsTreePathStep[];
  result: OradsTreeResult;
  pathSummary: string[];
  triangulation?: AdnexTriangulation;
  savedAt: string;
};

export function saveOradsWizardBridgePayload(
  payload: Omit<SreOradsWizardBridgePayload, "savedAt">,
): void {
  if (typeof window === "undefined") return;
  const data: SreOradsWizardBridgePayload = { ...payload, savedAt: new Date().toISOString() };
  sessionStorage.setItem(SRE_ORADS_WIZARD_BRIDGE_KEY, JSON.stringify(data));
}

export function loadOradsWizardBridgePayload(): SreOradsWizardBridgePayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SRE_ORADS_WIZARD_BRIDGE_KEY);
  if (!raw) return null;
  try {
    const parsed = SreOradsWizardBridgePayloadSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    return parsed.data as SreOradsWizardBridgePayload;
  } catch {
    return null;
  }
}

export function clearOradsWizardBridgePayload(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SRE_ORADS_WIZARD_BRIDGE_KEY);
}
