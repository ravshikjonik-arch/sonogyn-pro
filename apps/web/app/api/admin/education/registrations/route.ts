import { NextResponse } from "next/server";
import { z } from "zod";

import {
  EDUCATION_REGISTRATION_STATUSES,
  educationRegistrationFromRow,
} from "@/lib/education/registrations";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

const StatusPatchSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(EDUCATION_REGISTRATION_STATUSES),
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

  const gate = await requireAdminRole(supabase, user.id);
  if (!gate.ok) return { ok: false as const, response: gate.response };

  const rl = await consumeRateLimit(
    `admin-education-registrations:${user.id}`,
    RL.adminEducationRegistrations.limit,
    RL.adminEducationRegistrations.windowMs,
  );
  if (!rl.ok) {
    return { ok: false as const, response: NextResponse.json({ error: "Too many requests" }, { status: 429 }) };
  }

  return { ok: true as const, supabase };
}

export async function GET() {
  const gate = await adminGate();
  if (!gate.ok) return gate.response;

  const { data, error } = await gate.supabase
    .from("education_registrations")
    .select(
      "id,session_id,session_title,user_id,full_name,email,question,preferred_subtitle_language,status,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json({
    registrations: (data ?? []).map((row) => educationRegistrationFromRow(row)),
  });
}

export async function PATCH(request: Request) {
  const gate = await adminGate();
  if (!gate.ok) return gate.response;

  const json = await request.json().catch(() => null);
  const parsed = StatusPatchSchema.safeParse(json);
  if (!parsed.success || !isUuid(parsed.data.id)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data, error } = await gate.supabase
    .from("education_registrations")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .select(
      "id,session_id,session_title,user_id,full_name,email,question,preferred_subtitle_language,status,created_at,updated_at",
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 400 });
  }

  return NextResponse.json({ registration: educationRegistrationFromRow(data) });
}
