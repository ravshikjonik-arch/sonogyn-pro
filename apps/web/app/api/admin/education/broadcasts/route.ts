import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

const RecipientFilterSchema = z.enum(["all", "new", "contacted", "confirmed"]);

const BroadcastBodySchema = z
  .object({
    sessionId: z.string().min(1).max(120),
    recipientFilter: RecipientFilterSchema.default("confirmed"),
    subject: z.string().min(3).max(180),
    body: z.string().min(3).max(4000),
  })
  .strict();

async function adminGate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = await requireAdminRole(supabase, user.id);
  if (!role.ok) return { ok: false as const, response: role.response };

  const rl = await consumeRateLimit(
    `admin-education-broadcasts:${user.id}`,
    RL.adminEducationBroadcasts.limit,
    RL.adminEducationBroadcasts.windowMs,
  );
  if (!rl.ok) {
    return { ok: false as const, response: NextResponse.json({ error: "Too many requests" }, { status: 429 }) };
  }

  return { ok: true as const, supabase, userId: user.id };
}

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.ok) return gate.response;

  const json = await request.json().catch(() => null);
  const parsed = BroadcastBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  let query = gate.supabase
    .from("education_registrations")
    .select("email,status")
    .eq("session_id", body.sessionId)
    .not("email", "is", null);

  if (body.recipientFilter !== "all") {
    query = query.eq("status", body.recipientFilter);
  }

  const { data: recipients, error: recipientsError } = await query.limit(1000);
  if (recipientsError) {
    return NextResponse.json({ error: recipientsError.message }, { status: 503 });
  }

  const emails = Array.from(
    new Set(
      (recipients ?? [])
        .map((row) => String(row.email ?? "").trim().toLowerCase())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
    ),
  );

  const { data: broadcast, error } = await gate.supabase
    .from("education_broadcasts")
    .insert({
      session_id: body.sessionId,
      recipient_filter: body.recipientFilter,
      recipient_count: emails.length,
      recipient_emails: emails,
      subject: body.subject.trim(),
      body: body.body.trim(),
      status: "queued",
      created_by: gate.userId,
    })
    .select("id,recipient_count,recipient_emails,status")
    .single();

  if (error || !broadcast) {
    return NextResponse.json({ error: error?.message ?? "Broadcast save failed" }, { status: 400 });
  }

  return NextResponse.json({
    broadcast,
    note:
      "Рассылка сохранена в очередь. Подключите email-провайдер (Resend/SMTP/SendGrid), чтобы отправлять автоматически.",
  });
}
