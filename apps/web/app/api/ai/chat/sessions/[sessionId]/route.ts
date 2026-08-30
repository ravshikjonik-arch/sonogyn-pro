import { NextResponse } from "next/server";

import { getSessionMessages } from "@/lib/ai/sonogyn-chat/chat-sessions";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await getSessionMessages(supabase, sessionId, auth.userId);
  return NextResponse.json({ sessionId, messages });
}
