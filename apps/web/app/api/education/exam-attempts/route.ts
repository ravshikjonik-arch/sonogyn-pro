import { NextResponse } from "next/server";
import { ExamAttemptUpsertSchema, QuizProgressSchema } from "@repo/education-quiz";
import { z } from "zod";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const GetQuerySchema = z.object({
  blueprintId: z.string().min(1).max(200).optional(),
  mode: z.enum(["self_assessment", "quick", "certification", "mock"]).optional(),
});

function mapRow(row: Record<string, unknown>) {
  const answersParsed = QuizProgressSchema.safeParse(row.answers ?? {});
  return {
    id: row.id,
    blueprintId: row.blueprint_id,
    mode: row.mode,
    level: row.level ?? null,
    answers: answersParsed.success ? answersParsed.data : {},
    score: row.score ?? null,
    totalQuestions: row.total_questions ?? null,
    correctCount: row.correct_count ?? null,
    startedAt: row.started_at,
    finishedAt: row.finished_at ?? null,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const parsed = GetQuerySchema.safeParse({
    blueprintId: url.searchParams.get("blueprintId") ?? undefined,
    mode: url.searchParams.get("mode") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  let query = supabase
    .from("exam_attempts")
    .select(
      "id, blueprint_id, mode, level, answers, score, total_questions, correct_count, started_at, finished_at, updated_at",
    )
    .eq("user_id", auth.userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (parsed.data.blueprintId) query = query.eq("blueprint_id", parsed.data.blueprintId);
  if (parsed.data.mode) query = query.eq("mode", parsed.data.mode);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attempts: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)) });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `exam-attempts:${auth.userId}`,
    RL.examAttempts.limit,
    RL.examAttempts.windowMs,
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

  const parsed = ExamAttemptUpsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid exam attempt payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();
  const finishedAt = parsed.data.finished ? now : null;

  const { data, error } = await supabase
    .from("exam_attempts")
    .upsert(
      {
        user_id: auth.userId,
        blueprint_id: parsed.data.blueprintId,
        mode: parsed.data.mode,
        level: parsed.data.level ?? null,
        answers: parsed.data.answers,
        score: parsed.data.score ?? null,
        total_questions: parsed.data.totalQuestions ?? null,
        correct_count: parsed.data.correctCount ?? null,
        finished_at: finishedAt,
        updated_at: now,
      },
      { onConflict: "user_id,blueprint_id,mode" },
    )
    .select(
      "id, blueprint_id, mode, level, answers, score, total_questions, correct_count, started_at, finished_at, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attempt: mapRow(data as Record<string, unknown>) });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const blueprintId = new URL(request.url).searchParams.get("blueprintId")?.trim();
  const mode = new URL(request.url).searchParams.get("mode")?.trim() || "self_assessment";
  if (!blueprintId) {
    return NextResponse.json({ error: "blueprintId required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("exam_attempts")
    .delete()
    .eq("user_id", auth.userId)
    .eq("blueprint_id", blueprintId)
    .eq("mode", mode);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
