import { decodeCalculatorPayload } from "@/lib/calculators/deep-link";

export function readShareParamsFromUrl(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  return decodeCalculatorPayload(new URLSearchParams(window.location.search).get("p"));
}

export function parseShareBool(value: string | undefined): boolean | undefined {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

export function parseShareInt(value: string | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}
