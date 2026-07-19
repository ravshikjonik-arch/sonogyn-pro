import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const DomainSchema = z.enum(["orads", "birads", "tirads", "figo", "obstetrics", "gynecology", "ultrasound"]);
const MemoryTypeSchema = z.enum(["patient_context", "doctor_pattern", "case_learning", "safety_rule", "preference"]);

const PostMemorySchema = z.object({
  domain: DomainSchema,
  memoryType: MemoryTypeSchema,
  title: z.string().trim().min(1).max(160),
  detail: z.string().trim().min(1).max(2000),
  confidence: z.enum(["low", "medium", "high"]).default("medium"),
  patientId: z.string().uuid().optional(),
  sourceEventId: z.string().uuid().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "42P01" || /clinical_ai_memory/i.test(error?.message ?? "");
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const domain = url.searchParams.get("domain")?.trim();
  const patientId = url.searchParams.get("patientId")?.trim();

  if (domain && !DomainSchema.safeParse(domain).success) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }
  if (patientId && !isUuid(patientId)) {
    return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
  }

  let query = supabase
    .from("clinical_ai_memory")
    .select("id,patient_id,domain,memory_type,title,detail,confidence,payload,source_event_id,created_at,updated_at")
    .eq("user_id", auth.userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  if (domain) query = query.eq("domain", domain);
  if (patientId) query = query.or(`patient_id.eq.${patientId},patient_id.is.null`);

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return NextResponse.json({ memories: [], migrationRequired: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ memories: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(`clinical-memory:${auth.userId}`, RL.aiOrads.limit, RL.aiOrads.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PostMemorySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;

  if (body.patientId) {
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", body.patientId)
      .eq("created_by", auth.userId)
      .maybeSingle();
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("clinical_ai_memory")
    .insert({
      user_id: auth.userId,
      patient_id: body.patientId ?? null,
      domain: body.domain,
      memory_type: body.memoryType,
      title: body.title,
      detail: body.detail,
      confidence: body.confidence,
      payload: body.payload ?? {},
      source_event_id: body.sourceEventId ?? null,
    })
    .select("id,patient_id,domain,memory_type,title,detail,confidence,created_at")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ error: "Clinical memory migration required" }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ memory: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id || !isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("clinical_ai_memory")
    .update({ status: "archived", archived_at: now, updated_at: now })
    .eq("id", id)
    .eq("user_id", auth.userId);

  if (error) {
    if (isMissingTableError(error)) return NextResponse.json({ ok: true, migrationRequired: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
