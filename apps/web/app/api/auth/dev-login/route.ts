import { NextResponse } from "next/server";

import { ensureDevUserExists, getDevLoginConfig, isDevAutoLoginEnabled, signInDevUserViaAdminLink } from "@/lib/auth/dev-account";
import { safeInternalPath } from "@/lib/nav/safe-redirect";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

/**
 * Локальный автовход (только development). Учётные данные — в apps/web/.env.local, не в git.
 */
export async function GET(req: Request) {
  if (!isDevAutoLoginEnabled()) {
    return NextResponse.json({ error: "Dev auto-login disabled" }, { status: 404 });
  }

  const config = getDevLoginConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Задайте DEV_LOGIN_EMAIL, DEV_LOGIN_PASSWORD и DEV_LOGIN_FULL_NAME в .env.local" },
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const nextPath = safeInternalPath(url.searchParams.get("next"));

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
        return NextResponse.json({ error: `${signIn.error.message}. ${retryAdmin.message}` }, { status: 401 });
      }
    }
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
