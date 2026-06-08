import { NextResponse } from "next/server";

import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

/**
 * Clears Supabase auth cookies on the server (HttpOnly session). Call from the browser with credentials,
 * then optionally invoke client `signOut()` to drop any local persistence.
 */
export async function POST() {
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { supabase, cookiesToSet } = client;
  await supabase.auth.signOut();
  return nextJsonWithAuthCookies({ ok: true }, cookiesToSet);
}
