import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

/**
 * Текущий пользователь: сброс всех refresh-токенов Supabase (потеря телефона, компрометация).
 * Работает с cookie-сессией (web) и Authorization: Bearer (mobile).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `revoke-all-sessions:${auth.userId}`,
    RL.revokeAllSessions.limit,
    RL.revokeAllSessions.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Слишком много запросов. Подождите минуту." }, { status: 429 });
  }

  try {
    const service = createServiceRoleClient();
    const { error } = await service.auth.admin.signOut(auth.userId, "global");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Revoke failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
