import { CreatePatientBodySchema } from "@repo/types";
import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await consumeRateLimit(rateLimitKeyFromRequest(request, "patients-list"), 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Подождите." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const cursor = searchParams.get("cursor")?.trim() ?? "";
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  let query = supabase
    .from("patients")
    .select("id,display_label,external_ref,meta,created_at,updated_at")
    .eq("created_by", user.id)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (q.length > 0) {
    query = query.ilike("display_label", `%${q}%`);
  }

  if (cursor) {
    query = query.lt("updated_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    safeLog("patients list error", { code: error.code });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const patients = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? patients[patients.length - 1]?.updated_at ?? null : null;

  return NextResponse.json({
    patients,
    nextCursor,
    hasMore,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = CreatePatientBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { display_label, external_ref, meta } = parsed.data;

  const { data, error } = await supabase
    .from("patients")
    .insert({
      display_label,
      external_ref: external_ref ?? null,
      meta: meta ?? {},
      created_by: user.id,
    })
    .select("id,display_label,external_ref,meta,created_at,updated_at")
    .single();

  if (error) {
    safeLog("patient create error", { code: error.code });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ patient: data }, { status: 201 });
}
