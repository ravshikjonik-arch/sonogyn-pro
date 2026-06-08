import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const roots = [
  "/app",
  "/calculators",
  "/cases",
  "/library",
  "/profile",
  "/dashboard",
  "/workspace",
  "/uterus-3d",
  "/paywall",
  "/admin",
  "/patients",
  "/reference",
  "/nosologies",
];

export default async function middleware(request: NextRequest) {
  const { supabase, response } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));

  if (!isProtectedRoute) {
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
    "/cases/:path*",
    "/library",
    "/library/:path*",
    "/profile",
    "/profile/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/workspace",
    "/workspace/:path*",
    "/uterus-3d",
    "/uterus-3d/:path*",
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
  ],
};
