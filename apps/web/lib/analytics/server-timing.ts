/**
 * Лёгкие серверные метрики без ПДн (для логов / будущего drain).
 * Не отправляет данные во внешние счётчики.
 */

export function logServerTiming(label: string, startedAtMs: number, extra?: Record<string, string | number>) {
  const ms = Math.max(0, Math.round(performance.now() - startedAtMs));
  if (process.env.NODE_ENV === "development" || process.env.SONOGYN_LOG_SERVER_TIMING === "1") {
    // eslint-disable-next-line no-console -- opt-in diagnostics
    console.info("[timing]", label, `${ms}ms`, extra ?? {});
  }
  return ms;
}
