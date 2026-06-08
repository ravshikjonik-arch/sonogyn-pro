import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";

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
];

/** Как раньше `/elastography` — калькулятор доступен без Supabase-логина. */
const PUBLIC_WITHIN_PROTECTED = ["/calculators/elastography"];

function isPublicWithinProtected(pathname: string): boolean {
  return PUBLIC_WITHIN_PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default async function middleware(request: NextRequest) {
  const { supabase, response } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));

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
    "/app",
    "/app/:path*",
    "/calculators",
    "/calculators/:path*",
    "/cases",
    "/community",
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
  ],
};
