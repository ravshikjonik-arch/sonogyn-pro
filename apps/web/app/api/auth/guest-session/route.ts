import { NextResponse } from "next/server";

import {
  ensureDevUserExists,
  signInDevUserViaAdminLink,
} from "@/lib/auth/dev-account";
import { getGuestDemoConfig, isGuestDemoAutoLoginEnabled } from "@/lib/auth/guest-demo-account";
import { autoGrantPilotMedicalAccess } from "@/lib/auth/pilot-medical-access";
import {
  createSupabaseRouteHandlerClient,
  nextJsonWithAuthCookies,
} from "@/lib/route-handler-supabase";

/** Invisible demo session for full open access (no login UI). */
export async function POST() {
  if (!isGuestDemoAutoLoginEnabled()) {
    return NextResponse.json({ error: "Guest demo disabled" }, { status: 404 });
  }

  const config = getGuestDemoConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Guest demo not configured (GUEST_DEMO_PASSWORD or SONOGYN_AUTH_INTERNAL_SECRET)" },
      { status: 503 },
    );
  }

  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const { supabase, cookiesToSet } = client;

  const {
    data: { user: existing },
  } = await supabase.auth.getUser();

  if (existing) {
    await autoGrantPilotMedicalAccess(existing.id);
    return nextJsonWithAuthCookies({ ok: true, existing: true }, cookiesToSet);
  }

  const ensured = await ensureDevUserExists(config);
  if (!ensured.ok) {
    return NextResponse.json({ error: ensured.message }, { status: 503 });
  }

  let signedIn = await supabase.auth.signInWithPassword({
    email: config.email,
    password: config.password,
  });

  if (signedIn.error) {
    const viaAdmin = await signInDevUserViaAdminLink(supabase, config);
    if (!viaAdmin.ok) {
      return NextResponse.json(
        { error: `${signedIn.error.message}. ${viaAdmin.message}` },
        { status: 401 },
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await autoGrantPilotMedicalAccess(user.id);
  }

  return nextJsonWithAuthCookies({ ok: true }, cookiesToSet);
}
