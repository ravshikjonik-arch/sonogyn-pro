import type { SupabaseClient } from "@supabase/supabase-js";

export async function countUserCourseEnrollments(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("course_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}
