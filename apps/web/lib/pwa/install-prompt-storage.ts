export const PWA_INSTALL_DISMISS_KEY = "sonogyn:pwa-install-dismissed-at";
export const PWA_VISIT_COUNT_KEY = "sonogyn:pwa-visit-count";
export const PWA_VISIT_SESSION_KEY = "sonogyn:pwa-visit-counted";

export const PWA_INSTALL_CADENCE_MS = 14 * 24 * 60 * 60 * 1000;
/** Авто-баннер не на первом визите: минимум 2 сессии браузера. */
export const PWA_INSTALL_MIN_VISITS = 2;

export function readInstallDismissedAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PWA_INSTALL_DISMISS_KEY);
    if (!raw) return null;
    const t = Number(raw);
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
}

export function markInstallPromptDismissed(now = Date.now()): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PWA_INSTALL_DISMISS_KEY, String(now));
  } catch {
    /* quota / private mode */
  }
}

export function readVisitCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const n = Number(localStorage.getItem(PWA_VISIT_COUNT_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

/** Один инкремент на сессию вкладки (sessionStorage). Возвращает текущее число визитов. */
export function registerVisit(): number {
  if (typeof window === "undefined") return 0;
  try {
    if (sessionStorage.getItem(PWA_VISIT_SESSION_KEY)) return readVisitCount();
    const next = readVisitCount() + 1;
    localStorage.setItem(PWA_VISIT_COUNT_KEY, String(next));
    sessionStorage.setItem(PWA_VISIT_SESSION_KEY, "1");
    return next;
  } catch {
    return 0;
  }
}

/** true → можно показать авто-баннер (≥2 визитов и ≥14 дней с dismiss). */
export function shouldShowAutoInstallPrompt(
  now = Date.now(),
  lastDismissedAt: number | null = readInstallDismissedAt(),
  cadenceMs = PWA_INSTALL_CADENCE_MS,
  visitCount: number = readVisitCount(),
  minVisits = PWA_INSTALL_MIN_VISITS,
): boolean {
  if (visitCount < minVisits) return false;
  if (lastDismissedAt == null) return true;
  return now - lastDismissedAt >= cadenceMs;
}
