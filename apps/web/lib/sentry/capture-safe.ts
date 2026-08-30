import { isSentryEnabled } from "./flags";

type SafeScope = {
  boundary: string;
  route?: string;
  digest?: string;
};

/** Capture exception with digest-only payload — never attach clinical free text. */
export function captureSafeException(error: Error & { digest?: string }, scope: SafeScope): void {
  if (!isSentryEnabled()) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs") as typeof import("@sentry/nextjs");
    const synthetic = new Error(scope.digest ?? error.digest ?? "app-error");
    synthetic.name = `SafeBoundary:${scope.boundary}`;

    Sentry.withScope((sentryScope) => {
      sentryScope.setTag("boundary", scope.boundary);
      if (scope.route) sentryScope.setTag("route", scope.route);
      if (error.digest) sentryScope.setTag("digest", error.digest);
      sentryScope.setExtra("safe_capture", true);
      Sentry.captureException(synthetic);
    });
  } catch {
    /* telemetry must not break UX */
  }
}

/** Sanitized test ping — no user data. */
export function captureSentryTestEvent(): void {
  if (!isSentryEnabled()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs") as typeof import("@sentry/nextjs");
    Sentry.captureMessage("sonogyn-sentry-privacy-test", {
      level: "info",
      tags: { probe: "privacy-safe", synthetic: "true" },
      extra: { module: "observability", contains_phi: false },
    });
  } catch {
    /* ignore */
  }
}
