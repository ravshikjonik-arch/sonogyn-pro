import type { OradsInput, OradsResult } from "@/lib/orads-pro";

export const SRE_ORADS_BRIDGE_KEY = "sonogyn:sre-orads-bridge-v1";

export type SreOradsBridgePayload = {
  input: OradsInput;
  result: OradsResult;
  savedAt: string;
};

export function saveOradsBridgePayload(payload: Omit<SreOradsBridgePayload, "savedAt">): void {
  if (typeof window === "undefined") return;
  const data: SreOradsBridgePayload = { ...payload, savedAt: new Date().toISOString() };
  sessionStorage.setItem(SRE_ORADS_BRIDGE_KEY, JSON.stringify(data));
}

export function loadOradsBridgePayload(): SreOradsBridgePayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SRE_ORADS_BRIDGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SreOradsBridgePayload;
  } catch {
    return null;
  }
}

export function clearOradsBridgePayload(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SRE_ORADS_BRIDGE_KEY);
}
