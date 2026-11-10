import { NextResponse } from "next/server";

import { integrationRolloutSnapshot } from "@/lib/feature-flags/integration-rollout";
import {
  isSentryEnabled,
  resolveSentryEnvironment,
  resolveSentryRelease,
} from "@/lib/sentry/flags";
import { timingSafeEqual } from "@/lib/security/timing-safe";
import { isUpstashRestConfigured } from "@/lib/security/upstash-env";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/** Infrastructure details only for callers holding HEALTH_DETAILS_TOKEN (header x-health-token). */
function canSeeDetails(request: Request): boolean {
  const expected = process.env.HEALTH_DETAILS_TOKEN?.trim();
  const provided = request.headers.get("x-health-token")?.trim();
  if (!expected || !provided) return false;
  return timingSafeEqual(expected, provided);
}

/**
 * Health-check для аптайм-мониторинга и Vercel.
 * Публично — только status/time; конфигурация, флаги и release — по x-health-token.
 */
export async function GET(request: Request) {
  const checks = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    rateLimitStore: isUpstashRestConfigured(),
    evidenceRedisCache: isUpstashRestConfigured(),
    databaseUrlPooled: Boolean(
      process.env.DATABASE_URL?.includes("pooler") ||
        process.env.SUPABASE_DB_URL?.includes("pooler") ||
        process.env.DATABASE_URL?.includes("pgbouncer"),
    ),
  };

  let db: { ok: boolean; latencyMs: number | null; detail: string } = {
    ok: false,
    latencyMs: null,
    detail: "skipped",
  };

  if (checks.supabaseUrl && checks.serviceRoleKey) {
    const t0 = Date.now();
    try {
      const admin = createServiceRoleClient();
      const { error } = await admin.from("profiles").select("id", { head: true, count: "exact" }).limit(1);
      const latencyMs = Date.now() - t0;
      db = error
        ? { ok: false, latencyMs, detail: "query_error" }
        : { ok: true, latencyMs, detail: "ok" };
    } catch {
      db = { ok: false, latencyMs: Date.now() - t0, detail: "exception" };
    }
  } else {
    db = { ok: false, latencyMs: null, detail: "missing_service_role" };
  }

  const ok = checks.supabaseUrl && checks.supabaseAnonKey && (db.detail === "skipped" || db.ok);

  if (!canSeeDetails(request)) {
    return NextResponse.json(
      { status: ok ? "ok" : "degraded", time: new Date().toISOString() },
      { status: ok ? 200 : 503, headers: NO_STORE },
    );
  }

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      service: "sonogyn-web",
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      time: new Date().toISOString(),
      checks,
      db,
      observability: {
        sentryEnabled: isSentryEnabled(),
        environment: resolveSentryEnvironment(),
        release: resolveSentryRelease()?.slice(0, 12) ?? null,
        replayBlockedRoutes: "clinical-denylist",
      },
      rollout: integrationRolloutSnapshot(),
      stage3: {
        evidenceCache: checks.evidenceRedisCache ? "redis+memory" : "memory",
        regulationWorkerCron: "/api/cron/process-regulation-queue",
        indexesMigration: "20261104120000_stage3_perf_indexes.sql (apply manually)",
      },
    },
    {
      status: ok ? 200 : 503,
      headers: NO_STORE,
    },
  );
}
