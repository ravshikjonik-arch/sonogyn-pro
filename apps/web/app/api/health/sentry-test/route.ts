import { NextResponse } from "next/server";

import { captureSentryTestEvent } from "@/lib/sentry/capture-safe";
import { isSentryEnabled, resolveSentryEnvironment, resolveSentryRelease } from "@/lib/sentry/flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Privacy-safe Sentry probe — sends synthetic event without PHI.
 * Requires `SENTRY_TEST_SECRET` header match (ops only).
 */
export async function POST(request: Request) {
  const secret = process.env.SENTRY_TEST_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Probe disabled" }, { status: 404 });
  }

  const provided = request.headers.get("x-sentry-test-secret")?.trim();
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSentryEnabled()) {
    return NextResponse.json(
      { ok: false, reason: "SENTRY_ENABLED + DSN required" },
      { status: 503 },
    );
  }

  captureSentryTestEvent();

  return NextResponse.json({
    ok: true,
    probe: "sonogyn-sentry-privacy-test",
    environment: resolveSentryEnvironment(),
    release: resolveSentryRelease() ?? null,
    contains_phi: false,
  });
}
