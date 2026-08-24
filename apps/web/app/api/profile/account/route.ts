import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

/**
 * Удаление аккаунта (152-ФЗ): auth.users → cascade profiles/patients(created_by).
 * Требует подтверждение body.confirm === "DELETE".
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `account-delete:${auth.userId}`,
    RL.accountDelete.limit,
    RL.accountDelete.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Слишком много запросов. Подождите час." }, { status: 429 });
  }

  let body: { confirm?: string } = {};
  try {
    body = (await request.json()) as { confirm?: string };
  } catch {
    body = {};
  }
  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: 'Подтвердите удаление: передайте { "confirm": "DELETE" }.' },
      { status: 400 },
    );
  }

  try {
    const service = createServiceRoleClient();
    const { error } = await service.auth.admin.deleteUser(auth.userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
