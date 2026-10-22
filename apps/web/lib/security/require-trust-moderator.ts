import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isAdminEmail } from "@/lib/security/admin-emails";
import { requireAdminRole } from "@/lib/security/require-clinical-role";

export type TrustModeratorGate =
  | { ok: true; via: "admin_role" | "admin_email" }
  | { ok: false; response: NextResponse };

/** Админ (role) или email из ADMIN_EMAILS — для модерации верификации. */
export async function requireTrustModerator(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined,
): Promise<TrustModeratorGate> {
  const adminGate = await requireAdminRole(supabase, userId);
  if (adminGate.ok) return { ok: true, via: "admin_role" };

  if (isAdminEmail(email)) {
    return { ok: true, via: "admin_email" };
  }

  return {
    ok: false,
    response: NextResponse.json({ error: "Доступ только для модераторов." }, { status: 403 }),
  };
}
