import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health-check для аптайм-мониторинга и Vercel.
 * Лёгкий, без обращений к БД: проверяет только наличие критичных переменных окружения.
 * Никогда не раскрывает значения секретов.
 */
export function GET() {
  const checks = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    rateLimitStore: Boolean(
      process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    ),
  };

  const ok = checks.supabaseUrl && checks.supabaseAnonKey;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      service: "sonogyn-web",
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      time: new Date().toISOString(),
      checks,
    },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
