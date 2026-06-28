import type { SupabaseClient } from "@supabase/supabase-js";

import { getClinicalRole } from "@/lib/security/require-clinical-role";

/** Доступ к просмотру урока: автор, admin, enrollment, пробный урок. */
export async function canAccessLessonPlayback(
  supabase: SupabaseClient,
  userId: string,
  lesson: {
    course_id: string;
    is_free_preview: boolean;
  },
): Promise<boolean> {
  const role = await getClinicalRole(supabase, userId);
  if (role === "admin") return true;

  const { data: course } = await supabase
    .from("courses")
    .select("author_id, price_rub")
    .eq("id", lesson.course_id)
    .maybeSingle();

  if (course?.author_id === userId) return true;
  if (lesson.is_free_preview) return true;
  if (course && (course.price_rub as number) <= 0) return true;

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_id", lesson.course_id)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(enrollment);
}
