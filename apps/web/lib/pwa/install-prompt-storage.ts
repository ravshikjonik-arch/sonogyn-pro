export const PWA_INSTALL_DISMISS_KEY = "sonogyn:pwa-install-dismissed-at";

export const PWA_INSTALL_CADENCE_MS = 7 * 24 * 60 * 60 * 1000;

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

/** true → можно показать авто-баннер (прошло ≥7 дней с dismiss). */
export function shouldShowAutoInstallPrompt(
  now = Date.now(),
  lastDismissedAt: number | null = readInstallDismissedAt(),
  cadenceMs = PWA_INSTALL_CADENCE_MS,
): boolean {
  if (lastDismissedAt == null) return true;
  return now - lastDismissedAt >= cadenceMs;
}
