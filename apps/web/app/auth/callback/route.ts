import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import {
  completeAuthCallback,
  parseAuthCallbackParams,
  recoveryResetPath,
} from "@/lib/auth/auth-callback";
import { finalizeOAuthLogin } from "@/lib/auth/oauth-post-login";
import { autoGrantPilotMedicalAccess } from "@/lib/auth/pilot-medical-access";
import { supabaseCookieOptions, withSecureCookieOptions } from "@/utils/supabase/cookie-options";

function authErrorRedirect(
  origin: string,
  message: string,
  errorCode?: string | null,
  recovery = false,
) {
  if (recovery) {
    const url = new URL(recoveryResetPath(), origin);
    url.searchParams.set("error", "auth_callback");
    if (errorCode) url.searchParams.set("error_code", errorCode);
    url.searchParams.set("message", message.slice(0, 240));
    return url;
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("method", "social");
  loginUrl.searchParams.set("error", "auth_callback");
  if (errorCode) loginUrl.searchParams.set("error_code", errorCode);
  loginUrl.searchParams.set("oauth_message", message.slice(0, 160));
  return loginUrl;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = parseAuthCallbackParams(url, "/home");

  const hasAuthPayload = Boolean(params.code || params.tokenHash);
  if (!hasAuthPayload && !params.error && !params.errorCode) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const isRecoveryFlow =
    params.type === "recovery" ||
    params.next.includes("reset-password");

  /** Placeholder; final Location set after session + OAuth profile sync. */
  let redirectTarget = isRecoveryFlow ? recoveryResetPath() : params.next;
  let response = NextResponse.redirect(new URL(redirectTarget, url.origin));

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
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, withSecureCookieOptions(options));
          });
        },
      },
    },
  );

  const result = await completeAuthCallback(supabase, params);

  if (!result.ok) {
    return NextResponse.redirect(
      authErrorRedirect(url.origin, result.message, result.errorCode, isRecoveryFlow),
    );
  }

  if (!isRecoveryFlow) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      redirectTarget = await finalizeOAuthLogin(supabase, user, params.next);
      const nextResponse = NextResponse.redirect(new URL(redirectTarget, url.origin));
      response.cookies.getAll().forEach((cookie) => {
        nextResponse.cookies.set(cookie);
      });
      response = nextResponse;
      await autoGrantPilotMedicalAccess(user.id);
    }
  }

  return response;
}
