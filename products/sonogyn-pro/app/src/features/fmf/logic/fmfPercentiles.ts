/**
 * @deprecated Используйте medvedevBiometry.ts (Медведев, Прил. 1).
 * Обёртка для обратной совместимости.
 */

import { calcPercentile as calcMedvedevPercentile, type FmfLegacyMetric } from "./medvedevBiometry";

type Mode = "quick" | "strict";
type Metric = FmfLegacyMetric;

export function calcPercentile(
  metric: Metric,
  value: number | undefined,
  gaWeeks: number | undefined,
  mode: Mode,
  gaDays?: number,
): number | null {
  return calcMedvedevPercentile(metric, value, gaWeeks, gaDays, mode);
}
