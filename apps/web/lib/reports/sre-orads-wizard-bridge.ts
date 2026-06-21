import type { OradsTreePathStep, OradsTreeResult } from "@repo/orads-us";

export const SRE_ORADS_WIZARD_BRIDGE_KEY = "sonogyn:sre-orads-wizard-bridge-v1";

export type SreOradsWizardBridgePayload = {
  path: OradsTreePathStep[];
  result: OradsTreeResult;
  pathSummary: string[];
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
    return JSON.parse(raw) as SreOradsWizardBridgePayload;
  } catch {
    return null;
  }
}

export function clearOradsWizardBridgePayload(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SRE_ORADS_WIZARD_BRIDGE_KEY);
}
