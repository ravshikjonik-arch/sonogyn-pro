import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveGuestChatAuthorId } from "@/lib/chat/guest-chat-author";
import { safeLog } from "@/lib/security/safeLog";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

/** Session user, or the shared guest author via the service role. The service role stays on the server. */
export async function openDoctorChatDb(request: Request): Promise<
  | { ok: true; db: SupabaseClient; authorId: string; guest: boolean }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (auth.ok) {
    return { ok: true, db: supabase, authorId: auth.userId, guest: false };
  }

  try {
    const authorId = await resolveGuestChatAuthorId();
    return { ok: true, db: createServiceRoleClient(), authorId, guest: true };
  } catch (error) {
    safeLog("doctor chat guest", {
      message: error instanceof Error ? error.message : "guest",
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Чат сейчас не открылся. Попробуйте ещё раз." },
        { status: 503 },
      ),
    };
  }
}
