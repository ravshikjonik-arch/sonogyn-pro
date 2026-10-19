import type { AdnexInput } from "@repo/iota-models";

export const SRE_IOTA_BRIDGE_KEY = "sonogyn:sre-iota-bridge-v1";

export type SreIotaBridgePayload = {
  adnex: Partial<AdnexInput>;
  oradsCategory?: number | null;
  savedAt: string;
};

export function saveIotaBridgePayload(payload: Omit<SreIotaBridgePayload, "savedAt">): void {
  if (typeof window === "undefined") return;
  const data: SreIotaBridgePayload = { ...payload, savedAt: new Date().toISOString() };
  sessionStorage.setItem(SRE_IOTA_BRIDGE_KEY, JSON.stringify(data));
}

export function loadIotaBridgePayload(): SreIotaBridgePayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SRE_IOTA_BRIDGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SreIotaBridgePayload;
  } catch {
    return null;
  }
}

export function clearIotaBridgePayload(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SRE_IOTA_BRIDGE_KEY);
}
