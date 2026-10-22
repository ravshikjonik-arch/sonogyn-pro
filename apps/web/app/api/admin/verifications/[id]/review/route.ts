import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { requireTrustModerator } from "@/lib/security/require-trust-moderator";
import { isUuid } from "@/lib/security/uuid";
import { AdminReviewVerificationSchema } from "@/lib/trust/verification-schemas";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-log";
import { createClient } from "@/utils/supabase/server";

type Params = { id: string };

export async function POST(request: Request, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const modGate = await requireTrustModerator(supabase, user.id, user.email);
  if (!modGate.ok) return modGate.response;

  const rl = await consumeRateLimit(`admin-verifications:${user.id}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = AdminReviewVerificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.decision === "rejected" && !parsed.data.rejection_reason?.trim()) {
    return NextResponse.json({ error: "Укажите причину отклонения" }, { status: 400 });
  }

  await writeSecurityAuditLog({
    category: "admin",
    action: "doctor-verification.review",
    resource: id,
    metadata: { decision: parsed.data.decision },
  });

  if (modGate.via === "admin_role") {
    const { data, error } = await supabase.rpc("review_doctor_verification", {
      p_verification_id: id,
      p_decision: parsed.data.decision,
      p_rejection_reason: parsed.data.rejection_reason ?? null,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ verification: data });
  }

  const { createServiceRoleClient } = await import("@/utils/supabase/admin");
  const service = createServiceRoleClient();
  const { data, error } = await service.rpc("review_doctor_verification_svc", {
    p_verification_id: id,
    p_decision: parsed.data.decision,
    p_rejection_reason: parsed.data.rejection_reason ?? null,
    p_reviewer_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ verification: data });
}
