import { NextResponse } from "next/server";

import { ensureDevUserExists, getDevLoginConfig, isDevAutoLoginEnabled, signInDevUserViaAdminLink } from "@/lib/auth/dev-account";
import { safeInternalPath } from "@/lib/nav/safe-redirect";
import {
  DevLoginPostBodySchema,
  parseJsonBodyOrEmpty,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

function wantsHtmlRedirect(req: Request): boolean {
  const accept = req.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

function devLoginFailureRedirect(origin: string, reason: "service_role" | "failed" = "failed") {
  return NextResponse.redirect(new URL(`/login?dev_setup=${reason}`, origin));
}

/**
 * Локальный автовход (только development). Учётные данные — в apps/web/.env.local, не в git.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);

  if (!isDevAutoLoginEnabled()) {
    if (wantsHtmlRedirect(req)) return devLoginFailureRedirect(url.origin, "failed");
    return NextResponse.json({ error: "Dev auto-login disabled" }, { status: 404 });
  }

  const config = getDevLoginConfig();
  if (!config) {
    if (wantsHtmlRedirect(req)) return devLoginFailureRedirect(url.origin, "service_role");
    return NextResponse.json(
      { error: "Задайте DEV_LOGIN_EMAIL, DEV_LOGIN_PASSWORD, DEV_LOGIN_FULL_NAME и DEV_LOGIN_BIRTH_YEAR в .env.local" },
      { status: 500 },
    );
  }

  const nextPath = safeInternalPath(url.searchParams.get("next"));

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    if (wantsHtmlRedirect(req)) return devLoginFailureRedirect(url.origin, "failed");
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { supabase, cookiesToSet } = client;

  let signIn = await supabase.auth.signInWithPassword({
    email: config.email,
    password: config.password,
  });

  if (signIn.error) {
    const viaAdmin = await signInDevUserViaAdminLink(supabase, config);
    if (viaAdmin.ok) {
      const redirect = NextResponse.redirect(new URL(nextPath, url.origin));
      cookiesToSet.forEach(({ name, value, options }) => {
        redirect.cookies.set(name, value, options);
      });
      return redirect;
    }

    const ensured = await ensureDevUserExists(config);
    if (!ensured.ok) {
      if (wantsHtmlRedirect(req)) {
        return devLoginFailureRedirect(
          url.origin,
          ensured.message.includes("SUPABASE_SERVICE_ROLE_KEY") ? "service_role" : "failed",
        );
      }
      return NextResponse.json(
        {
          error: `Не удалось войти: ${signIn.error.message}. ${viaAdmin.message}`,
        },
        { status: 401 },
      );
    }

    signIn = await supabase.auth.signInWithPassword({
      email: config.email,
      password: config.password,
    });

    if (signIn.error) {
      const retryAdmin = await signInDevUserViaAdminLink(supabase, config);
      if (!retryAdmin.ok) {
        if (wantsHtmlRedirect(req)) return devLoginFailureRedirect(url.origin, "failed");
        return NextResponse.json({ error: `${signIn.error.message}. ${retryAdmin.message}` }, { status: 401 });
      }
    }
  } else {
    await ensureDevUserExists(config);
  }

  const redirect = NextResponse.redirect(new URL(nextPath, url.origin));
  cookiesToSet.forEach(({ name, value, options }) => {
    redirect.cookies.set(name, value, options);
  });

  return redirect;
}

export async function POST(req: Request) {
  if (!isDevAutoLoginEnabled()) {
    return NextResponse.json({ error: "Dev auto-login disabled" }, { status: 404 });
  }

  const parsedJson = await parseJsonBodyOrEmpty(req);
  if (!parsedJson.ok) return parsedJson.response;

  const parsedBody = DevLoginPostBodySchema.safeParse(parsedJson.data ?? {});
  if (!parsedBody.success) return zodErrorResponse(parsedBody.error);

  const config = getDevLoginConfig();
  if (!config) {
    return NextResponse.json({ error: "Dev login env not configured" }, { status: 500 });
  }

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { supabase, cookiesToSet } = client;

  let signIn = await supabase.auth.signInWithPassword({
    email: config.email,
    password: config.password,
  });

  if (signIn.error) {
    const ensured = await ensureDevUserExists(config);
    if (!ensured.ok) {
      return NextResponse.json({ error: `${signIn.error.message}. ${ensured.message}` }, { status: 401 });
    }

    signIn = await supabase.auth.signInWithPassword({
      email: config.email,
      password: config.password,
    });

    if (signIn.error) {
      return NextResponse.json({ error: signIn.error.message }, { status: 401 });
    }
  }

  return nextJsonWithAuthCookies({ ok: true }, cookiesToSet);
}
