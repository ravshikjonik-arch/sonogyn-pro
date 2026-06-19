import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);
  const { pathname } = req.nextUrl;
  const phoneVerified = req.auth?.user?.phoneVerified;

  const smsApi = pathname.startsWith("/api/auth/sms");
  const nextAuthApi = pathname.startsWith("/api/auth");

  if (!isLoggedIn && (pathname.startsWith("/dashboard") || pathname.startsWith("/billing"))) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return Response.redirect(login);
  }

  if (
    isLoggedIn &&
    !phoneVerified &&
    !pathname.startsWith("/verify-phone") &&
    !smsApi &&
    !nextAuthApi &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/billing") ||
      pathname === "/login" ||
      pathname === "/register")
  ) {
    return Response.redirect(new URL("/verify-phone", req.nextUrl.origin));
  }

  if (isLoggedIn && phoneVerified && (pathname === "/login" || pathname === "/register")) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (isLoggedIn && phoneVerified && pathname === "/verify-phone") {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/billing/:path*",
    "/login",
    "/register",
    "/verify-phone",
  ],
};
