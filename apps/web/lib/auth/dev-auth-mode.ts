/** Локальный режим разработки: длинная сессия, без обязательного confirm email, мягкий offline. */
const DEFAULT_DEV_SESSION_DAYS = 90;

export function isDevAuthModeEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_AUTH_MODE === "true";
}

function parseSessionDays(): number | undefined {
  const raw = process.env.AUTH_SESSION_MAX_AGE_DAYS?.trim();
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Срок cookie-сессии в днях (для UI / диагностики). */
export function getAuthSessionMaxAgeDays(): number | undefined {
  const fromEnv = parseSessionDays();
  if (fromEnv) return fromEnv;
  if (isDevAuthModeEnabled()) return DEFAULT_DEV_SESSION_DAYS;
  return undefined;
}

/** Cookie maxAge (секунды). В dev mode по умолчанию 90 дней. */
export function getAuthSessionMaxAgeSec(): number | undefined {
  const days = getAuthSessionMaxAgeDays();
  return days !== undefined ? days * 24 * 60 * 60 : undefined;
}

/** Клинический guard: сколько можно быть офлайн без принудительного выхода. */
export function getMaxOfflineSessionMs(): number {
  const maxAgeSec = getAuthSessionMaxAgeSec();
  if (maxAgeSec) return maxAgeSec * 1000;
  return 24 * 60 * 60 * 1000;
}
