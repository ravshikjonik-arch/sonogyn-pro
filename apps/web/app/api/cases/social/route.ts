import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

const QuerySchema = z.object({
  ids: z
    .string()
    .transform((value) => value.split(",").map((id) => id.trim()).filter(Boolean))
    .pipe(z.array(z.string().uuid()).max(100)),
});

export async function GET(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "cases-social", RL.casesListIp);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({ ids: searchParams.get("ids") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ids = parsed.data.ids;
  if (!ids.length) {
    return NextResponse.json({ liked: {}, bookmarked: {}, commentCounts: {} });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "cases-social", RL.casesListUser);
  if (userRl) return userRl;

  try {
    const [{ data: commentRows, error: commentsError }, { data: likes, error: likesError }, { data: marks, error: marksError }] =
      await Promise.all([
        supabase.from("teaching_case_comments").select("case_id").in("case_id", ids),
        supabase.from("teaching_case_likes").select("case_id").eq("user_id", auth.userId).in("case_id", ids),
        supabase.from("teaching_case_bookmarks").select("case_id").eq("user_id", auth.userId).in("case_id", ids),
      ]);

    if (commentsError || likesError || marksError) {
      safeLog("cases social load error", {
        commentsCode: commentsError?.code,
        likesCode: likesError?.code,
        marksCode: marksError?.code,
      });
      return NextResponse.json({ error: "Не удалось загрузить реакции" }, { status: 500 });
    }

    const commentCounts: Record<string, number> = {};
    commentRows?.forEach((row: { case_id: string }) => {
      commentCounts[row.case_id] = (commentCounts[row.case_id] ?? 0) + 1;
    });

    const liked: Record<string, boolean> = {};
    likes?.forEach((row: { case_id: string }) => {
      liked[row.case_id] = true;
    });

    const bookmarked: Record<string, boolean> = {};
    marks?.forEach((row: { case_id: string }) => {
      bookmarked[row.case_id] = true;
    });

    return NextResponse.json({ liked, bookmarked, commentCounts });
  } catch (error) {
    safeLog("cases social load error", { message: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Не удалось загрузить реакции" }, { status: 500 });
  }
}
