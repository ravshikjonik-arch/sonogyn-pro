import { NextResponse } from "next/server";
import { z } from "zod";

import { TeachingCaseCommentBodySchema } from "@repo/types";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import {
  chatMediaPathBelongsToScope,
  getChatMediaSignedUrl,
} from "@/lib/supabase/chat-media-storage";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({
  caseId: z.string().uuid(),
});

/** Load case discussion comments with server-side auth/RLS context. */
export async function GET(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-comment-load", RL.casesListIp);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-comment-load", RL.casesListUser);
  if (userRl) return userRl;

  try {
    const { data, error } = await supabase
      .from("teaching_case_comments")
      .select(
        "id,body,created_at,author_id,media_storage_path,media_type,is_best_answer,parent_comment_id,is_pinned_expert,mention_user_ids",
      )
      .eq("case_id", routeParams.data.caseId)
      .order("created_at", { ascending: true });

    if (error) {
      safeLog("case comment load error", { message: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const commentIds = (data ?? []).map((row) => row.id);
    let reactions: { comment_id: string; emoji: string; user_id: string }[] = [];
    if (commentIds.length) {
      const { data: reactionRows } = await supabase
        .from("teaching_case_comment_reactions")
        .select("comment_id,emoji,user_id")
        .in("comment_id", commentIds);
      reactions = reactionRows ?? [];
    }

    const reactionsByComment = reactions.reduce<Record<string, Record<string, number>>>(
      (acc, row) => {
        acc[row.comment_id] ??= {};
        acc[row.comment_id]![row.emoji] = (acc[row.comment_id]![row.emoji] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const comments = await Promise.all(
      (data ?? []).map(async (row) => ({
        ...row,
        reactions: reactionsByComment[row.id] ?? {},
        media_url: row.media_storage_path
          ? await getChatMediaSignedUrl(supabase, row.media_storage_path)
          : null,
      })),
    );

    return NextResponse.json({ comments });
  } catch (err) {
    safeLog("case comment load error", { message: err instanceof Error ? err.message : "unknown" });
    const message = err instanceof Error ? err.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Send a comment to a teaching case discussion with server-side auth/RLS context. */
export async function POST(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-comment-send", RL.caseCommentSend);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-comment-send", RL.caseCommentSend);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = TeachingCaseCommentBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data.body?.trim() || null;
  const mediaStoragePath = parsed.data.media_storage_path?.trim() || null;
  if (!body && !mediaStoragePath) {
    return NextResponse.json({ error: "Сообщение пустое." }, { status: 400 });
  }
  if (
    mediaStoragePath &&
    !chatMediaPathBelongsToScope(mediaStoragePath, {
      userId: auth.userId,
      scope: "case-comment",
      scopeId: routeParams.data.caseId,
    })
  ) {
    return NextResponse.json({ error: "Invalid media path" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("teaching_case_comments")
      .insert({
        case_id: routeParams.data.caseId,
        author_id: auth.userId,
        body: body ?? (parsed.data.media_type === "video" ? "Видео УЗИ" : "Снимок УЗИ"),
        media_storage_path: mediaStoragePath,
        media_type: parsed.data.media_type ?? null,
        parent_comment_id: parsed.data.parentCommentId ?? null,
        mention_user_ids: parsed.data.mentionUserIds ?? [],
      })
      .select(
        "id,body,created_at,author_id,media_storage_path,media_type,is_best_answer,parent_comment_id,is_pinned_expert,mention_user_ids",
      )
      .single();

    if (error || !data) {
      safeLog("case comment send error", { message: error?.message ?? "missing row" });
      return NextResponse.json({ error: error?.message ?? "Send failed" }, { status: 500 });
    }

    return NextResponse.json(
      {
        comment: {
          ...data,
          media_url: data.media_storage_path
            ? await getChatMediaSignedUrl(supabase, data.media_storage_path)
            : null,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    safeLog("case comment send error", { message: err instanceof Error ? err.message : "unknown" });
    const message = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
