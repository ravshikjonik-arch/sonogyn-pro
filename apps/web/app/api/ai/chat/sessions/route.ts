import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createChatSession,
  listChatSessions,
} from "@/lib/ai/sonogyn-chat/chat-sessions";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

const CreateSessionSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  domain: z.string().max(64).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await listChatSessions(supabase, auth.userId);
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown = {};
  try {
    json = await request.json();
  } catch {
    /* empty body ok */
  }

  const parsed = CreateSessionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const session = await createChatSession(supabase, {
    userId: auth.userId,
    title: parsed.data.title ?? "Новый чат",
    domain: parsed.data.domain ?? "general",
  });

  if (!session) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  return NextResponse.json({ session });
}
