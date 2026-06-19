import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);
  const { pathname } = req.nextUrl;

  if (!isLoggedIn && (pathname.startsWith("/dashboard") || pathname.startsWith("/billing"))) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return Response.redirect(login);
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/billing/:path*", "/login", "/register"],
};
