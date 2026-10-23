/**
 * Stage-1 baseline marks for doctor chat (compare before/after v2).
 * DevTools → Performance or: performance.getEntriesByName("doctor_chat:open").
 */

const OPEN_MARK = "doctor_chat:open:start";
const OPEN_MEASURE = "doctor_chat:open";

export function markDoctorChatOpenStart(): void {
  if (typeof performance === "undefined" || typeof performance.mark !== "function") return;
  try {
    performance.mark(OPEN_MARK);
  } catch {
    /* ignore */
  }
}

export function measureDoctorChatOpenEnd(messageCount: number): number | null {
  if (typeof performance === "undefined" || typeof performance.measure !== "function") return null;
  try {
    performance.measure(OPEN_MEASURE, OPEN_MARK);
    const entries = performance.getEntriesByName(OPEN_MEASURE);
    const last = entries[entries.length - 1];
    const durationMs = last?.duration ?? null;
    if (process.env.NODE_ENV === "development" && durationMs != null) {
      // eslint-disable-next-line no-console
      console.info("[doctor-chat baseline] open_ms=", Math.round(durationMs), "messages=", messageCount);
    }
    return durationMs;
  } catch {
    return null;
  }
}
