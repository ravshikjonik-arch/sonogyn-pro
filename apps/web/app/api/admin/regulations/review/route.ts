import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

const bodySchema = z.object({
  queueId: z.string().uuid(),
  extractionId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = await requireAdminRole(supabase, user.id);
  if (!gate.ok) return gate.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const queueStatus = body.decision === "approved" ? "approved" : "rejected";

  const { error: extError } = await supabase
    .from("regulation_extractions")
    .update({
      reviewed_at: now,
      reviewed_by: user.id,
      review_note: body.reviewNote ?? null,
    })
    .eq("id", body.extractionId)
    .eq("queue_id", body.queueId);

  if (extError) {
    return NextResponse.json({ error: extError.message }, { status: 500 });
  }

  const { error: qError } = await supabase
    .from("regulation_ingest_queue")
    .update({ status: queueStatus, updated_at: now })
    .eq("id", body.queueId);

  if (qError) {
    return NextResponse.json({ error: qError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: queueStatus,
    hint:
      body.decision === "approved"
        ? "Черновик одобрен. Перенесите поля в @repo/clinical-guidelines вручную или через PR (auto-publish не включён)."
        : undefined,
  });
}
