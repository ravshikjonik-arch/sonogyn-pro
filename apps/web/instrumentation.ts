/**
 * Opt-in Sentry only. Do not import `@sentry/nextjs` at module top-level:
 * that stalls first `next dev` request on "Compiling instrumentation …".
 */
function sentryWanted(): boolean {
  const flag = process.env.SENTRY_ENABLED?.trim().toLowerCase();
  if (flag !== "1" && flag !== "true") return false;
  const dsn = process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  return Boolean(dsn);
}

export async function register() {
  if (!sentryWanted()) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(
  error: unknown,
  request: unknown,
  context: unknown,
): Promise<void> {
  if (!sentryWanted()) return;
  const Sentry = await import("@sentry/nextjs");
  // captureRequestError typing varies by Sentry SDK minor; keep runtime-only.
  const capture = Sentry.captureRequestError as (
    err: unknown,
    req: unknown,
    ctx: unknown,
  ) => void | Promise<void>;
  await capture(error, request, context);
}
