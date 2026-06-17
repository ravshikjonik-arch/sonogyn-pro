import type { SupabaseClient } from "@supabase/supabase-js";

import {
  TRAINING_SESSIONS,
  trainingSessionFromRow,
  type EducationSessionRow,
  type TrainingSession,
} from "@/lib/education/live-learning";

const SESSION_SELECT =
  "id,title,description,format,status,starts_at,duration_minutes,instructor,level,primary_language,subtitle_languages,translation_plan,meeting_provider,meeting_url,href,materials,tags,agenda,outcomes,sort_order";

export async function loadTrainingSessions(
  supabase: SupabaseClient,
): Promise<{ sessions: TrainingSession[]; source: "supabase" | "fallback"; error: string | null }> {
  const { data, error } = await supabase
    .from("education_sessions")
    .select(SESSION_SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return { sessions: TRAINING_SESSIONS, source: "fallback", error: error.message };
  }

  const sessions = ((data ?? []) as EducationSessionRow[]).map((row) => trainingSessionFromRow(row));
  return {
    sessions: sessions.length > 0 ? sessions : TRAINING_SESSIONS,
    source: sessions.length > 0 ? "supabase" : "fallback",
    error: null,
  };
}

export async function loadTrainingSessionById(
  supabase: SupabaseClient,
  id: string,
): Promise<{ session: TrainingSession | null; source: "supabase" | "fallback"; error: string | null }> {
  const { data, error } = await supabase.from("education_sessions").select(SESSION_SELECT).eq("id", id).maybeSingle();

  if (!error && data) {
    return { session: trainingSessionFromRow(data as EducationSessionRow), source: "supabase", error: null };
  }

  const fallback = TRAINING_SESSIONS.find((session) => session.id === id) ?? null;
  return { session: fallback, source: "fallback", error: error?.message ?? null };
}
