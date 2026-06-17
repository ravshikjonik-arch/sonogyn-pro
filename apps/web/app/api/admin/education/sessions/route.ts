import { NextResponse } from "next/server";
import { z } from "zod";

import {
  TRAINING_MEETING_PROVIDERS,
  TRAINING_SESSION_FORMATS,
  TRAINING_SESSION_LEVELS,
  TRAINING_SESSION_STATUSES,
  trainingSessionFromRow,
  type EducationSessionRow,
} from "@/lib/education/live-learning";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

const stringList = z.array(z.string().trim().min(1).max(500)).max(20).default([]);

const EducationSessionBodySchema = z
  .object({
    id: z.string().min(3).max(120).regex(/^[a-z0-9._-]+$/i),
    title: z.string().min(3).max(240),
    description: z.string().min(3).max(1200),
    format: z.enum(TRAINING_SESSION_FORMATS),
    status: z.enum(TRAINING_SESSION_STATUSES),
    startsAt: z.string().datetime().nullable().optional(),
    durationMinutes: z.number().int().positive().nullable().optional(),
    instructor: z.string().min(1).max(160),
    level: z.enum(TRAINING_SESSION_LEVELS),
    primaryLanguage: z.enum(["ru", "en", "es", "de", "fr", "it"]).default("ru"),
    subtitleLanguages: z.array(z.enum(["ru", "en", "es", "de", "fr", "it"])).min(1).max(6).default(["ru"]),
    translationPlan: z.string().max(1000).default(""),
    meetingProvider: z.enum(TRAINING_MEETING_PROVIDERS),
    meetingUrl: z.string().url().nullable().optional().or(z.literal("")),
    href: z.string().max(300).nullable().optional().or(z.literal("")),
    materials: stringList,
    tags: stringList,
    agenda: stringList,
    outcomes: stringList,
    sortOrder: z.number().int().min(0).max(10000).default(100),
  })
  .strict();

async function adminGate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = await requireAdminRole(supabase, user.id);
  if (!role.ok) return { ok: false as const, response: role.response };

  const rl = await consumeRateLimit(
    `admin-education-sessions:${user.id}`,
    RL.adminEducationSessions.limit,
    RL.adminEducationSessions.windowMs,
  );
  if (!rl.ok) {
    return { ok: false as const, response: NextResponse.json({ error: "Too many requests" }, { status: 429 }) };
  }

  return { ok: true as const, supabase, userId: user.id };
}

const SELECT =
  "id,title,description,format,status,starts_at,duration_minutes,instructor,level,primary_language,subtitle_languages,translation_plan,meeting_provider,meeting_url,href,materials,tags,agenda,outcomes,sort_order";

export async function GET() {
  const gate = await adminGate();
  if (!gate.ok) return gate.response;

  const { data, error } = await gate.supabase
    .from("education_sessions")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json({
    sessions: ((data ?? []) as EducationSessionRow[]).map((row) => trainingSessionFromRow(row)),
  });
}

export async function POST(request: Request) {
  const gate = await adminGate();
  if (!gate.ok) return gate.response;

  const json = await request.json().catch(() => null);
  const parsed = EducationSessionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const payload = {
    id: body.id,
    title: body.title.trim(),
    description: body.description.trim(),
    format: body.format,
    status: body.status,
    starts_at: body.startsAt ?? null,
    duration_minutes: body.durationMinutes ?? null,
    instructor: body.instructor.trim(),
    level: body.level,
    primary_language: body.primaryLanguage,
    subtitle_languages: body.subtitleLanguages,
    translation_plan: body.translationPlan.trim(),
    meeting_provider: body.meetingProvider,
    meeting_url: body.meetingUrl || null,
    href: body.href || null,
    materials: body.materials,
    tags: body.tags,
    agenda: body.agenda,
    outcomes: body.outcomes,
    sort_order: body.sortOrder,
    created_by: gate.userId,
    updated_by: gate.userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await gate.supabase.from("education_sessions").upsert(payload).select(SELECT).single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Save failed" }, { status: 400 });
  }

  return NextResponse.json({ session: trainingSessionFromRow(data as EducationSessionRow) });
}

export async function DELETE(request: Request) {
  const gate = await adminGate();
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!/^[a-z0-9._-]{3,120}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { error } = await gate.supabase.from("education_sessions").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id });
}
