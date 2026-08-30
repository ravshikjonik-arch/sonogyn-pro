import { NextResponse } from "next/server";
import { z } from "zod";

import { CaseReportBodySchema } from "@repo/types";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string; commentId: string }> };

const ParamsSchema = z.object({
  caseId: z.string().uuid(),
  commentId: z.string().uuid(),
});

const ReactionBodySchema = z.object({
  emoji: z.enum(["👍", "💡", "❓", "✅"]),
  active: z.boolean(),
});

export async function POST(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-reaction", RL.caseCommentSend);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-reaction", RL.caseCommentSend);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = ReactionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.active) {
    const { error } = await supabase.from("teaching_case_comment_reactions").upsert({
      comment_id: routeParams.data.commentId,
      user_id: auth.userId,
      emoji: parsed.data.emoji,
    });
    if (error) {
      safeLog("case reaction upsert error", { code: error.code });
      return NextResponse.json({ error: "Не удалось добавить реакцию" }, { status: 400 });
    }
  } else {
    await supabase
      .from("teaching_case_comment_reactions")
      .delete()
      .eq("comment_id", routeParams.data.commentId)
      .eq("user_id", auth.userId)
      .eq("emoji", parsed.data.emoji);
  }

  return NextResponse.json({ ok: true });
}

const ReportBodySchema = CaseReportBodySchema;

export async function PUT(request: Request, { params }: Params) {
  return reportComment(request, params);
}

async function reportComment(request: Request, params: Promise<{ caseId: string; commentId: string }>) {
  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const json = await request.json().catch(() => null);
  const parsed = ReportBodySchema.safeParse({ ...(json as object), commentId: routeParams.data.commentId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await supabase.from("teaching_case_reports").insert({
    case_id: routeParams.data.caseId,
    comment_id: routeParams.data.commentId,
    reporter_id: auth.userId,
    reason: parsed.data.reason,
  });

  if (error) {
    safeLog("case report error", { code: error.code });
    return NextResponse.json({ error: "Не удалось отправить жалобу" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: Params) {
  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const json = (await request.json().catch(() => null)) as { action?: string; reason?: string } | null;
  if (json?.action === "pin_expert") {
    const { error } = await supabase.rpc("pin_expert_case_comment", {
      p_case_id: routeParams.data.caseId,
      p_comment_id: routeParams.data.commentId,
    });
    if (error) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    return NextResponse.json({ ok: true });
  }

  if (json?.action === "hide") {
    const { error } = await supabase.rpc("hide_teaching_case_comment", {
      p_comment_id: routeParams.data.commentId,
      p_reason: json.reason ?? null,
    });
    if (error) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
