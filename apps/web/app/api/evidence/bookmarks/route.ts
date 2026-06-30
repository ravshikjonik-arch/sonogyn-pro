import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const PostSchema = z.object({
  recordId: z.string().min(1).max(200),
  provider: z.string().min(1).max(40),
  title: z.string().min(1).max(500),
  url: z.string().url().max(2000),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabase
    .from("evidence_bookmarks")
    .select("id, record_id, provider, title, url, payload, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmarks: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `evidence-bookmarks:${auth.userId}`,
    RL.evidenceBookmarks.limit,
    RL.evidenceBookmarks.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bookmark payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("evidence_bookmarks")
    .upsert(
      {
        user_id: auth.userId,
        record_id: parsed.data.recordId,
        provider: parsed.data.provider,
        title: parsed.data.title,
        url: parsed.data.url,
        payload: parsed.data.payload ?? {},
      },
      { onConflict: "user_id,record_id" },
    )
    .select("id, record_id, provider, title, url, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmark: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const id = new URL(request.url).searchParams.get("id")?.trim();
  const recordId = new URL(request.url).searchParams.get("recordId")?.trim();
  if (!id && !recordId) {
    return NextResponse.json({ error: "id or recordId required" }, { status: 400 });
  }

  let query = supabase.from("evidence_bookmarks").delete().eq("user_id", auth.userId);
  if (id) query = query.eq("id", id);
  else if (recordId) query = query.eq("record_id", recordId);

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
