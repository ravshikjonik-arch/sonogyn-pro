/** Sentry / GlitchTip — opt-in via SENTRY_ENABLED + DSN. */
export function isSentryEnabled(): boolean {
  const flag = process.env.SENTRY_ENABLED?.trim().toLowerCase();
  const enabled = flag === "1" || flag === "true";
  const dsn =
    process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  return enabled && Boolean(dsn);
}

export function resolveSentryDsn(): string | undefined {
  return process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
}

/** Vercel: production | preview | development */
export function resolveSentryEnvironment(): string {
  const vercel = process.env.VERCEL_ENV?.trim();
  if (vercel === "production" || vercel === "preview" || vercel === "development") {
    return vercel;
  }
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/** Release = git SHA (Vercel) or SENTRY_RELEASE override. */
export function resolveSentryRelease(): string | undefined {
  return (
    process.env.SENTRY_RELEASE?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    undefined
  );
}

export function resolveTracesSampleRate(): number {
  const env = resolveSentryEnvironment();
  if (env === "development") return 0;
  if (env === "preview") return 0.02;
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE?.trim();
  if (raw) {
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
  }
  return 0.05;
}

/** Replay only on low-risk public surfaces; blocked on clinical routes. */
export function resolveReplaySessionSampleRate(): number {
  if (typeof window !== "undefined" && isReplayBlockedPath(window.location.pathname)) {
    return 0;
  }
  const env = resolveSentryEnvironment();
  if (env === "development") return 0;
  const raw = process.env.NEXT_PUBLIC_SENTRY_REPLAY_SAMPLE_RATE?.trim();
  if (raw) {
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
  }
  return env === "production" ? 0.01 : 0;
}

export function resolveReplayOnErrorSampleRate(): number {
  if (typeof window !== "undefined" && isReplayBlockedPath(window.location.pathname)) {
    return 0;
  }
  return resolveSentryEnvironment() === "production" ? 0.1 : 0;
}

/** Clinical routes — strip request bodies, drop breadcrumbs, block replay. */
export const SENTRY_CLINICAL_ROUTE_DENYLIST = [
  /^\/api\/ai(\/|$)/,
  /^\/api\/cases(\/|$)/,
  /^\/api\/patients(\/|$)/,
  /^\/api\/studies(\/|$)/,
  /^\/api\/copilot(\/|$)/,
  /^\/api\/dicom(\/|$)/,
  /^\/api\/profile(\/|$)/,
  /^\/cases(\/|$)/,
  /^\/patients(\/|$)/,
  /^\/workspace(\/|$)/,
  /^\/profile(\/|$)/,
  /^\/tools\/imaging(\/|$)/,
  /^\/upload(\/|$)/,
  /^\/media(\/|$)/,
] as const;

/** Session Replay blocked paths (superset of clinical). */
export const SENTRY_REPLAY_BLOCKLIST = [
  ...SENTRY_CLINICAL_ROUTE_DENYLIST,
  /^\/author\/profile(\/|$)/,
] as const;

export function pathFromUrlOrPath(input: string): string {
  try {
    if (input.startsWith("http://") || input.startsWith("https://")) {
      return new URL(input).pathname;
    }
    return input.split("?")[0] ?? input;
  } catch {
    return input.split("?")[0] ?? input;
  }
}

export function isClinicalRoutePath(pathOrUrl: string): boolean {
  const path = pathFromUrlOrPath(pathOrUrl);
  return SENTRY_CLINICAL_ROUTE_DENYLIST.some((re) => re.test(path));
}

export function isReplayBlockedPath(pathOrUrl: string): boolean {
  const path = pathFromUrlOrPath(pathOrUrl);
  return SENTRY_REPLAY_BLOCKLIST.some((re) => re.test(path));
}

/** Strip all query params on clinical/sensitive routes. */
export function shouldStripAllQueryParams(pathOrUrl: string): boolean {
  return isClinicalRoutePath(pathOrUrl);
}
