import type { SupabaseClient } from "@supabase/supabase-js";

import { getChatMediaSignedUrl } from "@/lib/supabase/chat-media-storage";

export type TeachingCaseCommentRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  media_storage_path: string | null;
  media_type: "image" | "video" | null;
  is_best_answer: boolean;
  parent_comment_id?: string | null;
  is_pinned_expert?: boolean;
  mention_user_ids?: string[];
  reactions?: Record<string, number>;
};

export type TeachingCaseCommentView = TeachingCaseCommentRow & {
  media_url: string | null;
};

/** Attach signed media URL for discussion bubbles (client or server). */
export async function enrichTeachingCaseComment(
  supabase: SupabaseClient,
  row: TeachingCaseCommentRow,
): Promise<TeachingCaseCommentView> {
  return {
    ...row,
    media_url: row.media_storage_path
      ? await getChatMediaSignedUrl(supabase, row.media_storage_path)
      : null,
  };
}

export function isTeachingCaseCommentRow(value: unknown): value is TeachingCaseCommentRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === "string" && typeof row.author_id === "string";
}
