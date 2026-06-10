import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

type Params = { userId: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Admin: revoke all Supabase refresh tokens for a user (e.g. lost device).
 * Requires profiles.role = admin and SUPABASE_SERVICE_ROLE_KEY on server.
 */
export async function POST(_request: Request, context: { params: Promise<Params> }) {
  const { userId: targetUserId } = await context.params;

  if (!UUID_RE.test(targetUserId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminGate = await requireAdminRole(supabase, user.id);
  if (!adminGate.ok) return adminGate.response;

  const rl = await consumeRateLimit(
    `admin-revoke-sessions:${user.id}`,
    RL.adminRevokeSessions.limit,
    RL.adminRevokeSessions.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const service = createServiceRoleClient();
    const { error } = await service.auth.admin.signOut(targetUserId, "global");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, userId: targetUserId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Revoke failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
