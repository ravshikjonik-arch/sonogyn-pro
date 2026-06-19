import type { SupabaseClient } from "@supabase/supabase-js";

import { getClinicalRole } from "@/lib/security/require-clinical-role";

export async function isEnrolledInCourse(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data?.id);
}

/** Доступ к контенту курса: enrollment, автор, admin. */
export async function canAccessCourseContent(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<boolean> {
  const role = await getClinicalRole(supabase, userId);
  if (role === "admin") return true;

  const { data: course } = await supabase.from("courses").select("author_id").eq("id", courseId).maybeSingle();
  if (course?.author_id === userId) return true;

  return isEnrolledInCourse(supabase, userId, courseId);
}
