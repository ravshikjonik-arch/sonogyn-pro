import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

export type DoctorToolDraftRow = {
  id: string;
  tool_id: string;
  state_json: unknown;
  preview_text: string;
  schema_version: string;
  lifecycle_status: string;
  content_hash: string | null;
  updated_at: string;
};

export function computeDoctorToolDraftHash(state: unknown): string {
  return createHash("sha256").update(JSON.stringify(state), "utf8").digest("hex");
}

export async function getDoctorToolDraft(
  supabase: SupabaseClient,
  userId: string,
  toolId: string,
): Promise<DoctorToolDraftRow | null> {
  const { data, error } = await supabase
    .from("doctor_tool_drafts")
    .select(
      "id,tool_id,state_json,preview_text,schema_version,lifecycle_status,content_hash,updated_at",
    )
    .eq("user_id", userId)
    .eq("tool_id", toolId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return null;
    throw new Error(error.message);
  }
  return data as DoctorToolDraftRow | null;
}

export async function upsertDoctorToolDraft(
  supabase: SupabaseClient,
  input: {
    userId: string;
    toolId: string;
    state: unknown;
    schemaVersion: string;
    previewText: string;
    lifecycleStatus: "draft" | "finalized" | "archived";
  },
): Promise<{ updatedAt: string; lifecycleStatus: string }> {
  const contentHash = computeDoctorToolDraftHash(input.state);
  const { data, error } = await supabase
    .from("doctor_tool_drafts")
    .upsert(
      {
        user_id: input.userId,
        tool_id: input.toolId,
        state_json: input.state,
        preview_text: input.previewText.slice(0, 200_000),
        schema_version: input.schemaVersion,
        lifecycle_status: input.lifecycleStatus,
        content_hash: contentHash,
      },
      { onConflict: "user_id,tool_id" },
    )
    .select("updated_at,lifecycle_status")
    .single();

  if (error) throw new Error(error.message);
  return {
    updatedAt: data.updated_at as string,
    lifecycleStatus: data.lifecycle_status as string,
  };
}
