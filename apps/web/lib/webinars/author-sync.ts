import type { SupabaseClient } from "@supabase/supabase-js";

import { ensureWebinarSession } from "@/lib/webinars/session";

/** Создать/обновить сессию LiveKit после сохранения урока-вебинара. */
export async function syncWebinarSessionAfterLessonSave(
  supabase: SupabaseClient,
  params: {
    lessonId: string;
    courseId: string;
    lessonType: string;
    scheduledAt: string | null | undefined;
  },
): Promise<void> {
  if (params.lessonType !== "webinar" || !params.scheduledAt) return;
  await ensureWebinarSession(supabase, {
    lessonId: params.lessonId,
    courseId: params.courseId,
    scheduledAt: params.scheduledAt,
  });
}
