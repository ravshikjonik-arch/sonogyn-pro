import type { SupabaseClient } from "@supabase/supabase-js";

import { getClinicalRole } from "@/lib/security/require-clinical-role";

/** Платный вебинар: курс price_rub > 0 + enrollment (или автор / admin). */
export async function canAccessWebinar(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
): Promise<boolean> {
  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("id, course_id, lesson_type")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || lesson.lesson_type !== "webinar") return false;

  const role = await getClinicalRole(supabase, userId);
  if (role === "admin") return true;

  const { data: course } = await supabase
    .from("courses")
    .select("author_id, price_rub, status")
    .eq("id", lesson.course_id as string)
    .maybeSingle();

  if (!course || course.status !== "published") {
    if (course?.author_id === userId) return true;
    return false;
  }

  if (course.author_id === userId) return true;

  if ((course.price_rub as number) <= 0) return false;

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_id", lesson.course_id as string)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(enrollment?.id);
}

export async function canHostWebinar(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
): Promise<boolean> {
  const role = await getClinicalRole(supabase, userId);
  if (role === "admin") return true;

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("course_id, lesson_type")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || lesson.lesson_type !== "webinar") return false;

  const { data: course } = await supabase
    .from("courses")
    .select("author_id")
    .eq("id", lesson.course_id as string)
    .maybeSingle();

  return course?.author_id === userId;
}
