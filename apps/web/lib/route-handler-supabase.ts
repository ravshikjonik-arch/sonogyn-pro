import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type RouteHandlerAuthCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function createSupabaseRouteHandlerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return {
      ok: false as const,
      status: 503,
      message:
        "На сервере не заданы NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY (перезапустите dev-сервер после правки .env.local).",
    };
  }

  const cookieStore = await cookies();
  const cookiesToSet: RouteHandlerAuthCookie[] = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        toSet.forEach((c) => cookiesToSet.push(c));
      },
    },
  });

  return { ok: true as const, supabase, cookiesToSet };
}

export function nextJsonWithAuthCookies(
  body: unknown,
  cookiesToSet: RouteHandlerAuthCookie[],
  status = 200,
) {
  const res = NextResponse.json(body, { status });
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options);
  });
  return res;
}
