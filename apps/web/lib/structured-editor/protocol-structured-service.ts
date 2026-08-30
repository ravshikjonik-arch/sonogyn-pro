import type { StructuredDocumentVersion, StructuredProtocolDraft } from "@repo/types";
import {
  StructuredProtocolDraftSchema,
  UpsertStructuredProtocolDraftBodySchema,
} from "@repo/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import { sanitizeStructuredSection } from "@/lib/structured-editor/document-sanitize";
import { ensureProtocolSections } from "@/lib/structured-editor/sections";
import { withProtocolSearchText } from "@/lib/structured-editor/search-text";
import { safeLog } from "@/lib/security/safeLog";

function sanitizeProtocolDraft(raw: StructuredProtocolDraft): StructuredProtocolDraft {
  const sections = ensureProtocolSections({});
  for (const [key, section] of Object.entries(raw.sections)) {
    const id = key as keyof typeof sections;
    sections[id] = sanitizeStructuredSection(section);
  }
  return withProtocolSearchText({
    ...raw,
    sections,
    lastSavedAt: new Date().toISOString(),
  });
}

function rowToDraft(row: {
  sections_json: unknown;
  editor_state_json: unknown;
  search_text: string;
  template_version: string;
  algorithm_version: string | null;
  algorithm_date: string | null;
  scale_source: string | null;
  physician_confirmed_conclusion: boolean;
  updated_at: string;
}): StructuredProtocolDraft {
  const sections = ensureProtocolSections(
    typeof row.sections_json === "object" && row.sections_json !== null
      ? (row.sections_json as StructuredProtocolDraft["sections"])
      : {},
  );

  return {
    templateVersion: "protocol-v1",
    algorithmVersion: row.algorithm_version ?? undefined,
    algorithmDate: row.algorithm_date ?? undefined,
    scaleSource: row.scale_source ?? undefined,
    sections,
    searchText: row.search_text,
    editorState:
      typeof row.editor_state_json === "object" && row.editor_state_json !== null
        ? (row.editor_state_json as Record<string, unknown>)
        : {},
    physicianConfirmedConclusion: row.physician_confirmed_conclusion,
    lastSavedAt: row.updated_at,
  };
}

export async function getProtocolStructuredDraft(
  supabase: SupabaseClient,
  studyId: string,
): Promise<{ draft: StructuredProtocolDraft | null; updatedAt: string | null; id: string | null }> {
  const { data, error } = await supabase
    .from("protocol_structured_drafts")
    .select(
      "id,sections_json,editor_state_json,search_text,template_version,algorithm_version,algorithm_date,scale_source,physician_confirmed_conclusion,updated_at",
    )
    .eq("study_id", studyId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return { draft: null, updatedAt: null, id: null };
    throw new Error(error.message);
  }

  if (!data) return { draft: null, updatedAt: null, id: null };

  return {
    id: data.id,
    updatedAt: data.updated_at,
    draft: rowToDraft(data),
  };
}

export async function upsertProtocolStructuredDraft(
  supabase: SupabaseClient,
  input: {
    studyId: string;
    userId: string;
    body: unknown;
  },
): Promise<
  | { ok: true; draft: StructuredProtocolDraft; updatedAt: string; versionNumber: number }
  | { ok: false; conflict: true }
  | { ok: false; conflict: false; error: string }
> {
  const parsed = UpsertStructuredProtocolDraftBodySchema.safeParse(input.body);
  if (!parsed.success) {
    return { ok: false, conflict: false, error: "Invalid payload" };
  }

  const draft = sanitizeProtocolDraft(parsed.data.draft);

  const { data: existing } = await supabase
    .from("protocol_structured_drafts")
    .select("id,updated_at")
    .eq("study_id", input.studyId)
    .maybeSingle();

  if (
    parsed.data.expectedUpdatedAt &&
    existing?.updated_at &&
    existing.updated_at !== parsed.data.expectedUpdatedAt
  ) {
    return { ok: false, conflict: true };
  }

  const row = {
    study_id: input.studyId,
    user_id: input.userId,
    sections_json: draft.sections,
    editor_state_json: draft.editorState,
    search_text: draft.searchText,
    template_version: draft.templateVersion,
    algorithm_version: draft.algorithmVersion ?? null,
    algorithm_date: draft.algorithmDate ?? null,
    scale_source: draft.scaleSource ?? null,
    physician_confirmed_conclusion: draft.physicianConfirmedConclusion,
  };

  let draftId = existing?.id as string | undefined;

  if (draftId) {
    const { data: updated, error } = await supabase
      .from("protocol_structured_drafts")
      .update(row)
      .eq("id", draftId)
      .eq("user_id", input.userId)
      .select("id,updated_at")
      .single();

    if (error) return { ok: false, conflict: false, error: error.message };
    draftId = updated.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("protocol_structured_drafts")
      .insert(row)
      .select("id,updated_at")
      .single();

    if (error) return { ok: false, conflict: false, error: error.message };
    draftId = inserted.id;
  }

  const { count } = await supabase
    .from("protocol_structured_draft_versions")
    .select("id", { count: "exact", head: true })
    .eq("draft_id", draftId);

  const versionNumber = (count ?? 0) + 1;

  if (!parsed.data.isAutosave || versionNumber === 1 || versionNumber % 5 === 0) {
    await supabase.from("protocol_structured_draft_versions").insert({
      draft_id: draftId,
      study_id: input.studyId,
      user_id: input.userId,
      version_number: versionNumber,
      sections_json: draft.sections,
      editor_state_json: draft.editorState,
      search_text: draft.searchText,
      template_version: draft.templateVersion,
      algorithm_version: draft.algorithmVersion ?? null,
      algorithm_date: draft.algorithmDate ?? null,
      scale_source: draft.scaleSource ?? null,
      change_summary: parsed.data.changeSummary ?? null,
    });
  }

  await supabase.from("protocol_structured_draft_audit_events").insert({
    study_id: input.studyId,
    user_id: input.userId,
    event_type: parsed.data.isAutosave ? "autosave" : "save",
    version_number: versionNumber,
    meta: { templateVersion: draft.templateVersion },
  });

  const { data: fresh } = await supabase
    .from("protocol_structured_drafts")
    .select("updated_at")
    .eq("id", draftId)
    .single();

  return {
    ok: true,
    draft: { ...draft, lastSavedAt: fresh?.updated_at ?? new Date().toISOString() },
    updatedAt: fresh?.updated_at ?? new Date().toISOString(),
    versionNumber,
  };
}

export async function listProtocolStructuredVersions(
  supabase: SupabaseClient,
  studyId: string,
): Promise<StructuredDocumentVersion[]> {
  const { data, error } = await supabase
    .from("protocol_structured_draft_versions")
    .select("id,version_number,change_summary,template_version,algorithm_version,created_at")
    .eq("study_id", studyId)
    .order("version_number", { ascending: false })
    .limit(30);

  if (error) {
    safeLog("protocol structured versions error", { code: error.code });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    versionNumber: row.version_number,
    changeSummary: row.change_summary,
    templateVersion: row.template_version,
    algorithmVersion: row.algorithm_version,
    createdAt: row.created_at,
  }));
}

export async function restoreProtocolStructuredVersion(
  supabase: SupabaseClient,
  input: { studyId: string; userId: string; versionId: string },
): Promise<{ draft: StructuredProtocolDraft; updatedAt: string } | null> {
  const { data: versionRow, error } = await supabase
    .from("protocol_structured_draft_versions")
    .select(
      "sections_json,editor_state_json,search_text,template_version,algorithm_version,algorithm_date,scale_source",
    )
    .eq("id", input.versionId)
    .eq("study_id", input.studyId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error || !versionRow) return null;

  const draft = sanitizeProtocolDraft(
    StructuredProtocolDraftSchema.parse({
      templateVersion: versionRow.template_version,
      algorithmVersion: versionRow.algorithm_version ?? undefined,
      algorithmDate: versionRow.algorithm_date ?? undefined,
      scaleSource: versionRow.scale_source ?? undefined,
      sections: versionRow.sections_json,
      searchText: versionRow.search_text,
      editorState: versionRow.editor_state_json,
      physicianConfirmedConclusion: false,
    }),
  );

  const result = await upsertProtocolStructuredDraft(supabase, {
    studyId: input.studyId,
    userId: input.userId,
    body: {
      draft,
      changeSummary: "Восстановление версии",
      isAutosave: false,
    },
  });

  if (!result.ok) return null;

  await supabase.from("protocol_structured_draft_audit_events").insert({
    study_id: input.studyId,
    user_id: input.userId,
    event_type: "version_restore",
    meta: { versionId: input.versionId },
  });

  return { draft: result.draft, updatedAt: result.updatedAt };
}
