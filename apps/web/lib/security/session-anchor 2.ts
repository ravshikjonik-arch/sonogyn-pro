/** Timestamp последнего подтверждённого online-доступа к клинической сессии. */

export const SESSION_ANCHOR_KEY = "sonogyn_session_anchor_v1";

export function markSessionAnchorNow(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_ANCHOR_KEY, String(Date.now()));
  } catch {
    /* private mode */
  }
}

export function readSessionAnchor(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(SESSION_ANCHOR_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}
