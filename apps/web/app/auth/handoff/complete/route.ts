import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { defaultHandoffStore, planHandoffComplete } from "@/lib/auth/domain-handoff";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { isSonogynCustomDomainHost } from "@/lib/shell/custom-domain";
import { isDomainHandoffEnabled } from "@/lib/shell/custom-domain-handoff";
import { supabaseCookieOptions, withSecureCookieOptions } from "@/utils/supabase/cookie-options";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

/** Deployment host only: exchanges a one-time code for a session on this host. */
export async function GET(request: NextRequest) {
  if (!isDomainHandoffEnabled() || isSonogynCustomDomainHost(request.headers.get("host"))) {
    return noStore(new NextResponse("Not Found", { status: 404 }));
  }

  const origin = request.nextUrl.origin;
  const failed = () => {
    const url = new URL("/login", origin);
    url.searchParams.set("handoff", "expired");
    return noStore(NextResponse.redirect(url, 303));
  };

  const rl = await consumeRateLimit(
    rateLimitKeyFromRequest(request, "auth-domain-handoff-complete"),
    RL.authDomainHandoff.limit,
    RL.authDomainHandoff.windowMs,
  );
  if (!rl.ok) return failed();

  const cookieJar = NextResponse.next();
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
            cookieJar.cookies.set(name, value, withSecureCookieOptions(options));
          });
        },
      },
    },
  );

  const outcome = await planHandoffComplete(
    {
      store: defaultHandoffStore(),
      async verifyTokenHash(tokenHash) {
        const { data, error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
        return error ? null : (data.user?.id ?? null);
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    },
    request.nextUrl.searchParams.get("code"),
  );

  const response = outcome.kind === "ok" ? noStore(NextResponse.redirect(new URL(outcome.next, origin), 303)) : failed();
  cookieJar.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}
