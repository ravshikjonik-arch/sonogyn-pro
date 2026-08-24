import { NextResponse } from "next/server";

import {
  EmptyJsonBodySchema,
  parseJsonBodyOrEmpty,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

/**
 * Clears Supabase auth cookies on the server (HttpOnly session). Call from the browser with credentials,
 * then optionally invoke client `signOut()` to drop any local persistence.
 */
export async function POST(request: Request) {
  const raw = await parseJsonBodyOrEmpty(request);
  if (!raw.ok) return raw.response;
  const parsed = EmptyJsonBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { supabase, cookiesToSet } = client;
  await supabase.auth.signOut();
  return nextJsonWithAuthCookies({ ok: true }, cookiesToSet);
}
