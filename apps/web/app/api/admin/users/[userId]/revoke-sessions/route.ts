import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { UuidPathSchema, zodErrorResponse } from "@/lib/security/api-body-schemas";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-log";

type Params = { userId: string };

/**
 * Admin: revoke all Supabase refresh tokens for a user (e.g. lost device).
 * Requires profiles.role = admin and SUPABASE_SERVICE_ROLE_KEY on server.
 */
export async function POST(_request: Request, context: { params: Promise<Params> }) {
  const { userId: rawTarget } = await context.params;
  const targetParsed = UuidPathSchema.safeParse(rawTarget);
  if (!targetParsed.success) {
    return zodErrorResponse(targetParsed.error);
  }
  const targetUserId = targetParsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminGate = await requireAdminRole(supabase, user.id);
  if (!adminGate.ok) return adminGate.response;

  await writeSecurityAuditLog({
    category: "admin",
    action: "revoke-sessions.requested",
    resource: targetUserId,
  });

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
      await writeSecurityAuditLog({
        category: "admin",
        action: "revoke-sessions.failed",
        resource: targetUserId,
        success: false,
        metadata: { message: error.message },
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await writeSecurityAuditLog({
      category: "admin",
      action: "revoke-sessions.ok",
      resource: targetUserId,
      success: true,
    });
    return NextResponse.json({ ok: true, userId: targetUserId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Revoke failed";
    await writeSecurityAuditLog({
      category: "admin",
      action: "revoke-sessions.exception",
      resource: targetUserId,
      success: false,
      metadata: { message },
    });
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
