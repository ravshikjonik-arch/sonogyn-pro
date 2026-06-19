import type { SupabaseClient } from "@supabase/supabase-js";

export async function countOfflineSeats(
  supabase: SupabaseClient,
  lessonId: string,
): Promise<{ registered: number; maxSeats: number | null; remaining: number | null }> {
  const { count } = await supabase
    .from("offline_lesson_registrations")
    .select("id", { count: "exact", head: true })
    .eq("lesson_id", lessonId)
    .eq("status", "registered");

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("max_seats")
    .eq("id", lessonId)
    .maybeSingle();

  const registered = count ?? 0;
  const maxSeats = (lesson?.max_seats as number | null) ?? null;
  const remaining = maxSeats != null ? Math.max(0, maxSeats - registered) : null;

  return { registered, maxSeats, remaining };
}
