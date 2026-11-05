import type { GuidedStep } from "../types";
import type { GuidedWindowId } from "../types";
import { EARLY_STEPS } from "./early";
import { T1_SCREENING_STEPS } from "./t1-screening";
import { T2_ANOMALY_STEPS } from "./t2-anomaly";
import { T3_GROWTH_STEPS } from "./t3-growth";

const CATALOG: Record<Exclude<GuidedWindowId, "between_windows">, GuidedStep[]> = {
  early: EARLY_STEPS,
  t1_screening: T1_SCREENING_STEPS,
  t2_anomaly: T2_ANOMALY_STEPS,
  t3_growth: T3_GROWTH_STEPS,
};

export function getStepsForWindow(
  windowId: Exclude<GuidedWindowId, "between_windows">,
): GuidedStep[] {
  return CATALOG[windowId].map((s) => ({ ...s })).sort((a, b) => a.order - b.order);
}

export { EARLY_STEPS, T1_SCREENING_STEPS, T2_ANOMALY_STEPS, T3_GROWTH_STEPS };
