import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

type Params = { userId: string };

const MEDICAL_ACCESS_STATUSES = new Set([
  "pending",
  "student",
  "resident",
  "doctor",
  "verified_doctor",
  "suspended",
]);

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

  const rl = await consumeRateLimit(`admin-medical-access:${user.id}`, 40, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as {
    status?: unknown;
    note?: unknown;
  } | null;

  const status = typeof body?.status === "string" ? body.status : "";
  if (!MEDICAL_ACCESS_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid medical access status" }, { status: 400 });
  }

  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : null;

  const { error } = await supabase.rpc("set_medical_access_status", {
    p_user_id: targetUserId,
    p_status: status,
    p_note: note || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: targetUserId, status });
}
