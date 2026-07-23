import { NextResponse } from "next/server";

import { z } from "zod";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-log";

type Params = { userId: string };

const MEDICAL_ACCESS_STATUSES = new Set([
  "pending",
  "student",
  "resident",
  "doctor",
  "verified_doctor",
  "suspended",
]);

const AdminMedicalAccessBodySchema = z.object({
  status: z.enum([
    "pending",
    "student",
    "resident",
    "doctor",
    "verified_doctor",
    "suspended",
  ]),
  note: z
    .union([z.string().trim().max(1000), z.null()])
    .optional(),
});

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const { userId: targetUserId } = await context.params;

  if (!isUuid(targetUserId)) {
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

  await writeSecurityAuditLog({
    category: "admin",
    action: "medical-access.requested",
    resource: targetUserId,
  });

  const rl = await consumeRateLimit(`admin-medical-access:${user.id}`, 40, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = AdminMedicalAccessBodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.ok) {
    await writeSecurityAuditLog({
      category: "admin",
      action: "medical-access.bad_payload",
      resource: targetUserId,
      success: false,
    });
    return NextResponse.json(
      { error: parsed.error!.flatten() },
      { status: 400 },
    );
  }

  const { status } = parsed.data!;

  const { error } = await supabase.rpc("set_medical_access_status", {
    p_user_id: targetUserId,
    p_status: status,
  });

  if (error) {
    await writeSecurityAuditLog({
      category: "admin",
      action: "medical-access.failed",
      resource: targetUserId,
      success: false,
      metadata: { message: error.message },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeSecurityAuditLog({
    category: "admin",
    action: "medical-access.ok",
    resource: targetUserId,
    success: true,
    metadata: { status },
  });
  return NextResponse.json({ ok: true, userId: targetUserId, status });
}
