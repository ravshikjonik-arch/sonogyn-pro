import type { SupabaseClient } from "@supabase/supabase-js";

import { createLiveKitRoomName } from "@/lib/webinars/livekit";
import type { WebinarSessionRow } from "@/lib/webinars/types";

export async function ensureWebinarSession(
  supabase: SupabaseClient,
  params: { lessonId: string; courseId: string; scheduledAt: string },
): Promise<WebinarSessionRow | null> {
  const { data: existing } = await supabase
    .from("webinar_sessions")
    .select("*")
    .eq("lesson_id", params.lessonId)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await supabase
      .from("webinar_sessions")
      .update({
        scheduled_at: params.scheduledAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id as string)
      .select("*")
      .single();

    if (error) return existing as WebinarSessionRow;
    return updated as WebinarSessionRow;
  }

  const roomName = createLiveKitRoomName(params.lessonId);
  const { data, error } = await supabase
    .from("webinar_sessions")
    .insert({
      lesson_id: params.lessonId,
      course_id: params.courseId,
      room_name: roomName,
      scheduled_at: params.scheduledAt,
      status: "scheduled",
    })
    .select("*")
    .single();

  if (error) return null;
  return data as WebinarSessionRow;
}
