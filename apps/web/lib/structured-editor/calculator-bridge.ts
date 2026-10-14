import type { CalculatorSystem, StructuredCalculatorBlock } from "@repo/types";

import { createCalculatorBlock } from "@/lib/structured-editor/document-sanitize";
import {
  loadOradsBridgePayload,
  type SreOradsBridgePayload,
} from "@/lib/reports/sre-orads-bridge";

export const STRUCTURED_CALC_PENDING_KEY = "sonogyn:structured-calc-pending-v1";

export type StructuredCalcPending = {
  system: CalculatorSystem;
  category: string;
  summary: string;
  savedAt: string;
};

export function saveStructuredCalcPending(payload: Omit<StructuredCalcPending, "savedAt">): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    STRUCTURED_CALC_PENDING_KEY,
    JSON.stringify({ ...payload, savedAt: new Date().toISOString() } satisfies StructuredCalcPending),
  );
}

export function loadStructuredCalcPending(): StructuredCalcPending | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STRUCTURED_CALC_PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StructuredCalcPending;
  } catch {
    return null;
  }
}

export function clearStructuredCalcPending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STRUCTURED_CALC_PENDING_KEY);
}

export function oradsBridgeToStructuredBlock(payload: SreOradsBridgePayload): StructuredCalculatorBlock {
  const category = `O-RADS ${payload.result.category}`;
  const summary = [
    payload.result.patternLabel,
    payload.result.riskText,
    payload.result.recommendation,
  ]
    .filter(Boolean)
    .join(" · ");

  return createCalculatorBlock({
    system: "O-RADS",
    category,
    summary: summary || category,
  });
}

/** Prefer dedicated pending payload; fallback to O-RADS SRE bridge session. */
export function loadPendingCalculatorBlock(): StructuredCalculatorBlock | null {
  const pending = loadStructuredCalcPending();
  if (pending) {
    return createCalculatorBlock({
      system: pending.system,
      category: pending.category,
      summary: pending.summary,
    });
  }

  const orads = loadOradsBridgePayload();
  if (orads) return oradsBridgeToStructuredBlock(orads);

  return null;
}
