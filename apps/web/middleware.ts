import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { assertProductionSecretsConfigured } from "@/lib/security/production-secrets";
import { getClinicalRole, roleMeetsMinimum } from "@/lib/security/require-clinical-role";

assertProductionSecretsConfigured();

const roots = [
  "/app",
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
  "/patients",
  "/reference",
  "/nosologies",
  "/guidelines",
  "/assistant",
  "/idea-deep-endometriosis",
];

/** Как раньше `/elastography` — калькулятор доступен без Supabase-логина. */
const PUBLIC_WITHIN_PROTECTED = ["/calculators/elastography"];

function isPublicWithinProtected(pathname: string): boolean {
  return PUBLIC_WITHIN_PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    if (process.env.NODE_ENV === "production") {
      if (pathname.startsWith("/api/debug") || pathname.startsWith("/api/auth/dev-login")) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const { response } = await updateSession(request);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }

  const { supabase, response } = await updateSession(request);

  const isProtectedRoute = roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));

  if (isProtectedRoute) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
  }

  if (!isProtectedRoute || isPublicWithinProtected(pathname)) {
    return response;
  }

  if (isDevSkipAuthEnabled()) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const role = await getClinicalRole(supabase, user.id);
      if (!role || !roleMeetsMinimum(role, "admin")) {
        const denyUrl = request.nextUrl.clone();
        denyUrl.pathname = "/app";
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

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirectedFrom", pathname);

  const redirectResponse = NextResponse.redirect(loginUrl);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/app",
    "/app/:path*",
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
    "/patients",
    "/patients/:path*",
    "/reference",
    "/reference/:path*",
    "/nosologies",
    "/nosologies/:path*",
    "/guidelines",
    "/guidelines/:path*",
    "/assistant",
    "/assistant/:path*",
    "/idea-deep-endometriosis",
    "/idea-deep-endometriosis/:path*",
  ],
};
