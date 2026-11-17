import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseCookieOptions, withSecureCookieOptions } from "@/utils/supabase/cookie-options";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseCookieOptions(),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, withSecureCookieOptions(options));
          });
        },
      },
    },
  );

  // Dev/offline: never block the whole document on a hung Auth round-trip.
  const AUTH_TIMEOUT_MS = process.env.NODE_ENV === "development" ? 2500 : 8000;
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("supabase_auth_getUser_timeout")), AUTH_TIMEOUT_MS);
      }),
    ]);
  } catch {
    // Keep cookies/response; page renders as guest if Auth is slow or unreachable.
  }

  return { supabase, response: supabaseResponse };
}
