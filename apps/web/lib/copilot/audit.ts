import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordAuditEvent(
  supabase: SupabaseClient,
  params: {
    actorId: string;
    studyId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: params.actorId,
    study_id: params.studyId ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    payload: params.payload ?? {},
  });

  if (error) {
    console.error("[audit] insert failed", error.message);
  }
}
