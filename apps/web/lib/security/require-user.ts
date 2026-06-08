import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures the incoming request maps to an authenticated Supabase user using `getUser()` (JWT verified server-side).
 */
export async function requireSupabaseUser(supabase: SupabaseClient): Promise<
  | { ok: true; userId: string; email: string | null }
  | { ok: false; response: NextResponse }
> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, userId: user.id, email: user.email ?? null };
}
