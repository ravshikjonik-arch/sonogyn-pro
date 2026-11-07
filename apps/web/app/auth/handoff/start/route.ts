import { NextResponse, type NextRequest } from "next/server";

import { planHandoffStart, defaultHandoffStore } from "@/lib/auth/domain-handoff";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { safeLog } from "@/lib/security/safeLog";
import { isSonogynCustomDomainHost } from "@/lib/shell/custom-domain";
import { DOMAIN_HANDOFF_COMPLETE_PATH, isDomainHandoffEnabled } from "@/lib/shell/custom-domain-handoff";
import { resolveDeploymentOrigin } from "@/lib/shell/custom-domain-proxy";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

function loginUrl(origin: string, next: string): URL {
  const url = new URL("/login", origin);
  url.searchParams.set("redirectedFrom", next);
  return url;
}

/** Custom domain only: issues a one-time code for the current session and sends the browser to the deployment host. */
export async function GET(request: NextRequest) {
  if (!isDomainHandoffEnabled() || !isSonogynCustomDomainHost(request.headers.get("host"))) {
    return noStore(new NextResponse("Not Found", { status: 404 }));
  }

  // Router fetches and prefetches must not mint codes; an empty answer makes the browser load this URL as a page.
  const fetchMode = request.headers.get("sec-fetch-mode");
  if (fetchMode && fetchMode !== "navigate") return noStore(new NextResponse(null, { status: 204 }));

  const deploymentOrigin = resolveDeploymentOrigin();
  const rawNext = request.nextUrl.searchParams.get("next");
  if (!deploymentOrigin) {
    return noStore(NextResponse.redirect(loginUrl(request.nextUrl.origin, rawNext ?? "/")));
  }

  const rl = await consumeRateLimit(
    rateLimitKeyFromRequest(request, "auth-domain-handoff-start"),
    RL.authDomainHandoff.limit,
    RL.authDomainHandoff.windowMs,
  );
  if (!rl.ok) {
    return noStore(
      new NextResponse("Слишком много попыток. Подождите минуту.", {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }),
    );
  }

  const supabase = await createClient();
  const outcome = await planHandoffStart(
    {
      async getUser() {
        const { data } = await supabase.auth.getUser();
        return data.user ? { id: data.user.id, email: data.user.email } : null;
      },
      async hasVerifiedMfa() {
        const { data } = await supabase.auth.mfa.listFactors();
        return (data?.all ?? []).some((f) => f.status === "verified");
      },
      async createTokenHash(email) {
        const { data, error } = await createServiceRoleClient().auth.admin.generateLink({ type: "magiclink", email });
        return error ? null : (data.properties?.hashed_token ?? null);
      },
      store: defaultHandoffStore(),
    },
    rawNext,
  );

  if (outcome.kind === "login") {
    return noStore(NextResponse.redirect(loginUrl(request.nextUrl.origin, outcome.next)));
  }
  if (outcome.kind === "direct") {
    if (outcome.reason !== "mfa") safeLog("domain handoff not issued", { reason: outcome.reason });
    return noStore(NextResponse.redirect(loginUrl(deploymentOrigin, outcome.next)));
  }

  const target = new URL(DOMAIN_HANDOFF_COMPLETE_PATH, deploymentOrigin);
  target.searchParams.set("code", outcome.code);
  return noStore(NextResponse.redirect(target, 303));
}
