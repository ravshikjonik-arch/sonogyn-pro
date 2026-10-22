import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { requireModeratorRole } from "@/lib/security/require-clinical-role";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-log";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

const BodySchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().min(3).max(2000),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const modGate = await requireModeratorRole(supabase, user.id);
  if (!modGate.ok) return modGate.response;

  const rl = await consumeRateLimit(`admin-reputation-penalty:${user.id}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!isUuid(parsed.data.userId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  await writeSecurityAuditLog({
    category: "moderation",
    action: "reputation.penalty",
    resource: parsed.data.userId,
    metadata: { reasonLength: parsed.data.reason.length },
  });

  const { error } = await supabase.rpc("apply_moderation_penalty", {
    p_user_id: parsed.data.userId,
    p_reason: parsed.data.reason,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
