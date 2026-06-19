import type { SupabaseClient } from "@supabase/supabase-js";

export type CourseProgressSnapshot = {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  completedLessonIds: string[];
};

export async function fetchCourseProgress(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<CourseProgressSnapshot> {
  const [{ data: lessons }, { data: progressRows }] = await Promise.all([
    supabase.from("course_lessons").select("id").eq("course_id", courseId),
    supabase
      .from("course_lesson_progress")
      .select("lesson_id, completed")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .eq("completed", true),
  ]);

  const totalLessons = lessons?.length ?? 0;
  const completedLessonIds = (progressRows ?? []).map((r) => r.lesson_id as string);
  const completedLessons = completedLessonIds.length;
  const progressPercent =
    totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

  return { courseId, totalLessons, completedLessons, progressPercent, completedLessonIds };
}

export async function recalculateEnrollmentProgress(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<number> {
  const snapshot = await fetchCourseProgress(supabase, userId, courseId);
  await supabase
    .from("course_enrollments")
    .update({
      progress_percent: snapshot.progressPercent,
      last_activity_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("course_id", courseId);

  return snapshot.progressPercent;
}

export async function markLessonCompleted(
  supabase: SupabaseClient,
  params: { userId: string; courseId: string; lessonId: string },
): Promise<{ ok: true; progressPercent: number } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("course_lesson_progress").upsert(
    {
      user_id: params.userId,
      course_id: params.courseId,
      lesson_id: params.lessonId,
      completed: true,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) return { ok: false, error: error.message };

  const progressPercent = await recalculateEnrollmentProgress(supabase, params.userId, params.courseId);
  return { ok: true, progressPercent };
}
