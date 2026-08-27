import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { isDevSkipAuthEnabled, isFullOpenAccessEnabled } from "@/lib/auth/dev-account";
import { needsPhoneVerification } from "@/lib/auth/phone-verified";
import { safeInternalPath } from "@/lib/nav/safe-redirect";
import { resolveCorsHeaders } from "@/lib/security/cors";
import { smsSendEdgeRateLimit } from "@/lib/security/edge-sms-rate-limit";
import { shouldBlockSuspiciousApiBot } from "@/lib/security/bot-detection";
import { assertProductionSecretsConfigured } from "@/lib/security/production-secrets";
import { getClinicalRole, roleMeetsMinimum } from "@/lib/security/require-clinical-role";

assertProductionSecretsConfigured();

const roots = [
  "/app",
  "/home",
  "/feed",
  "/ai",
  "/tools",
  "/calculators",
  "/cases",
  "/community",
  "/library",
  "/profile",
  "/dashboard",
  "/workspace",
  "/mockups",
  "/uterus-3d",
  "/breast-3d",
  "/ovary-atlas",
  "/paywall",
  "/admin",
  "/author",
  "/patients",
  "/reference",
  "/nosologies",
  "/guidelines",
  "/evidence",
  "/assistant",
  "/voice-reader",
  "/idea-deep-endometriosis",
  "/musa",
  "/demo",
];

/**
 * Soft-gate: клинический shell открыт без логина.
 * PHI / профиль / PRO / admin / author — только после входа.
 */
const AUTH_REQUIRED_PREFIXES = [
  "/patients",
  "/profile",
  "/admin",
  "/author",
  "/paywall",
  "/dashboard",
] as const;

/** Legacy whitelist (остаётся для совместимости; soft-gate шире). */
const PUBLIC_WITHIN_PROTECTED = [
  "/app",
  "/home",
  "/tools",
  "/calculators",
  "/ai",
  "/assistant",
  "/library",
  "/feed",
  "/cases",
  "/community",
  "/mockups",
  "/uterus-3d",
  "/breast-3d",
  "/ovary-atlas",
  "/reference",
  "/nosologies",
  "/guidelines",
  "/evidence",
  "/workspace",
  "/voice-reader",
  "/idea-deep-endometriosis",
  "/musa",
  "/demo",
  "/calculators/elastography",
  "/calculators/bi-rads",
  "/calculators/ti-rads",
  "/tools/calc/rads/o-rads",
  "/tools/calc/rads/bi-rads",
  "/tools/calc/rads/ln-rads",
  "/tools/calc/rads/ti-rads",
  "/tools/adjunct/ti-rads",
  "/tools/calc/gyn/elastography",
  "/tools/calc/gyn/cervical-intelligence",
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isAuthRequiredPath(pathname: string): boolean {
  if (
    isFullOpenAccessEnabled() &&
    !matchesPrefix(pathname, "/admin") &&
    !matchesPrefix(pathname, "/author")
  ) {
    return false;
  }
  return AUTH_REQUIRED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function isPublicWithinProtected(pathname: string): boolean {
  if (isAuthRequiredPath(pathname)) return false;
  return PUBLIC_WITHIN_PROTECTED.some((prefix) => matchesPrefix(pathname, prefix));
}

function redirectWithSessionCookies(request: NextRequest, response: NextResponse, pathname: string, search = "") {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  applySecurityHeaders(redirectResponse);
  return redirectResponse;
}

function applySecurityHeaders(response: NextResponse): void {
  // Базовые заголовки и CSP централизованно заданы в next.config.ts (headers()).
  // Здесь дублируем минимум для middleware-ответов (redirect/429/403), где конфиг
  // не всегда применяется. Значения согласованы с next.config (X-Frame-Options: DENY).
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
}

function applyCorsHeaders(response: NextResponse, corsHeaders: Record<string, string> | null): void {
  if (!corsHeaders) return;
  for (const [k, v] of Object.entries(corsHeaders)) response.headers.set(k, v);
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const corsHeaders = resolveCorsHeaders(request);

    // Preflight: отвечаем сразу, без сессии/rate-limit.
    if (request.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: corsHeaders ? 204 : 403 });
      if (corsHeaders) {
        for (const [k, v] of Object.entries(corsHeaders)) preflight.headers.set(k, v);
      }
      applySecurityHeaders(preflight);
      return preflight;
    }

    if (process.env.NODE_ENV === "production") {
      if (
        pathname.startsWith("/api/debug") ||
        pathname.startsWith("/api/auth/dev-login") ||
        pathname.startsWith("/api/e2e")
      ) {
        const res = NextResponse.json({ error: "Not found" }, { status: 404 });
        applySecurityHeaders(res);
        applyCorsHeaders(res, corsHeaders);
        return res;
      }
    }

    if (pathname.startsWith("/api/auth/send-code") || pathname.startsWith("/api/auth/verify-code")) {
      // Rate limit в Route Handler + Redis/KV (см. verification-rate-limit.ts).
      // Edge middleware не держит in-memory counters между cold starts на Vercel.
    }

    const isSmsSendApi =
      (pathname === "/api/auth/sms/send" || pathname === "/api/auth/phone/send-otp") &&
      request.method === "POST";
    if (isSmsSendApi) {
      const rl = await smsSendEdgeRateLimit(request);
      if (!rl.ok) {
        const res = NextResponse.json(
          { error: "Слишком много запросов. Подождите минуту.", retryAfterSec: rl.retryAfterSec },
          { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
        );
        applySecurityHeaders(res);
        applyCorsHeaders(res, corsHeaders);
        return res;
      }
    }

    if (shouldBlockSuspiciousApiBot(request)) {
      const res = NextResponse.json({ error: "Forbidden" }, { status: 403 });
      applySecurityHeaders(res);
      applyCorsHeaders(res, corsHeaders);
      return res;
    }

    const { response } = await updateSession(request).catch(() => ({
      response: NextResponse.next({ request }),
    }));
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    applySecurityHeaders(response);
    applyCorsHeaders(response, corsHeaders);
    return response;
  }

  const { supabase, response } = await updateSession(request);
  applySecurityHeaders(response);

  if (pathname === "/verify-phone") {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");

    if (isDevSkipAuthEnabled()) {
      return response;
    }

    const {
      data: { user: verifyUser },
    } = await supabase.auth.getUser();

    if (!verifyUser) {
      const loginSearch = new URLSearchParams({ redirectedFrom: "/verify-phone" });
      return redirectWithSessionCookies(request, response, "/login", loginSearch.toString());
    }

    if (!needsPhoneVerification(verifyUser)) {
      const dest = safeInternalPath(request.nextUrl.searchParams.get("redirectedFrom"), "/profile/dashboard");
      return redirectWithSessionCookies(request, response, dest);
    }

    return response;
  }

  if (pathname === "/login" || pathname === "/register") {
    if (isFullOpenAccessEnabled() && !isDevSkipAuthEnabled()) {
      return redirectWithSessionCookies(request, response, "/home");
    }

    if (!isDevSkipAuthEnabled()) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom");
        if (needsPhoneVerification(user)) {
          const verifySearch = new URLSearchParams({
            redirectedFrom: safeInternalPath(redirectedFrom, "/profile/dashboard"),
          });
          return redirectWithSessionCookies(
            request,
            response,
            "/verify-phone",
            verifySearch.toString(),
          );
        }
        const dest = safeInternalPath(redirectedFrom, "/cases");
        return redirectWithSessionCookies(request, response, dest);
      }
    }
    return response;
  }

  const isProtectedRoute = roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));

  if (isProtectedRoute) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
  }

  if (!isProtectedRoute || isPublicWithinProtected(pathname)) {
    return response;
  }

  if (
    isDevSkipAuthEnabled() ||
    (isFullOpenAccessEnabled() &&
      !matchesPrefix(pathname, "/admin") &&
      !matchesPrefix(pathname, "/author"))
  ) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (needsPhoneVerification(user)) {
      const verifySearch = new URLSearchParams({ redirectedFrom: pathname });
      return redirectWithSessionCookies(request, response, "/verify-phone", verifySearch.toString());
    }

    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const role = await getClinicalRole(supabase, user.id);
      if (!role || !roleMeetsMinimum(role, "admin")) {
        const denyUrl = request.nextUrl.clone();
        denyUrl.pathname = "/cases";
        denyUrl.search = "";
        const denyResponse = NextResponse.redirect(denyUrl);
        response.cookies.getAll().forEach((cookie) => {
          denyResponse.cookies.set(cookie);
        });
        return denyResponse;
      }
    }
    if (pathname === "/author" || pathname.startsWith("/author/")) {
      const role = await getClinicalRole(supabase, user.id);
      if (!role || (role !== "author" && role !== "admin")) {
        const denyUrl = request.nextUrl.clone();
        denyUrl.pathname = "/cases";
        denyUrl.search = "";
        const denyResponse = NextResponse.redirect(denyUrl);
        response.cookies.getAll().forEach((cookie) => {
          denyResponse.cookies.set(cookie);
        });
        return denyResponse;
      }
    }
    return response;
  }

  const loginSearch = new URLSearchParams({ redirectedFrom: pathname });
  return redirectWithSessionCookies(request, response, "/login", loginSearch.toString());
}

export const config = {
  matcher: [
    "/api/:path*",
    "/login",
    "/register",
    "/verify-phone",
    "/app",
    "/app/:path*",
    "/home",
    "/home/:path*",
    "/feed",
    "/feed/:path*",
    "/tools",
    "/tools/:path*",
    "/ai",
    "/ai/:path*",
    "/calculators",
    "/calculators/:path*",
    "/cases",
    "/community",
    "/community/:path*",
    "/cases/:path*",
    "/library",
    "/library/:path*",
    "/profile",
    "/profile/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/workspace",
    "/workspace/:path*",
    "/mockups",
    "/mockups/:path*",
    "/uterus-3d",
    "/uterus-3d/:path*",
    "/breast-3d",
    "/breast-3d/:path*",
    "/ovary-atlas",
    "/ovary-atlas/:path*",
    "/paywall",
    "/paywall/:path*",
    "/admin",
    "/admin/:path*",
    "/author",
    "/author/:path*",
    "/patients",
    "/patients/:path*",
    "/reference",
    "/reference/:path*",
    "/nosologies",
    "/nosologies/:path*",
    "/guidelines",
    "/guidelines/:path*",
    "/evidence",
    "/evidence/:path*",
    "/assistant",
    "/assistant/:path*",
    "/voice-reader",
    "/voice-reader/:path*",
    "/idea-deep-endometriosis",
    "/idea-deep-endometriosis/:path*",
    "/musa",
    "/musa/:path*",
    "/demo",
    "/demo/:path*",
  ],
};
