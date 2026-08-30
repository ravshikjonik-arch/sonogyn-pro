import type { StructuredCaseDocument, StructuredDocumentVersion } from "@repo/types";
import {
  StructuredCaseDocumentSchema,
  UpsertStructuredCaseBodySchema,
} from "@repo/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import { sanitizeStructuredSection } from "@/lib/structured-editor/document-sanitize";
import { ensureCaseSections } from "@/lib/structured-editor/sections";
import { withCaseSearchText } from "@/lib/structured-editor/search-text";
import { safeLog } from "@/lib/security/safeLog";

type CaseAccess = { isOwner: boolean; canRead: boolean };

export async function loadCaseStructuredAccess(
  supabase: SupabaseClient,
  caseId: string,
  userId: string,
): Promise<CaseAccess | null> {
  const { data: caseRow, error } = await supabase
    .from("cases")
    .select("id,user_id,status,is_public")
    .eq("id", caseId)
    .maybeSingle();

  if (error || !caseRow) return null;

  const isOwner = caseRow.user_id === userId;
  const canRead = isOwner || (caseRow.status === "published" && caseRow.is_public === true);
  return { isOwner, canRead };
}

function sanitizeCaseDocument(raw: StructuredCaseDocument): StructuredCaseDocument {
  const sections = ensureCaseSections({});
  for (const [key, section] of Object.entries(raw.sections)) {
    const id = key as keyof typeof sections;
    sections[id] = sanitizeStructuredSection(section);
  }
  return withCaseSearchText({
    ...raw,
    sections,
    lastSavedAt: new Date().toISOString(),
  });
}

function rowToDocument(row: {
  sections_json: unknown;
  editor_state_json: unknown;
  search_text: string;
  template_version: string;
  algorithm_version: string | null;
  physician_confirmed_conclusion: boolean;
  updated_at: string;
}): StructuredCaseDocument {
  const sections = ensureCaseSections(
    typeof row.sections_json === "object" && row.sections_json !== null
      ? (row.sections_json as StructuredCaseDocument["sections"])
      : {},
  );

  return {
    templateVersion: "case-v1",
    algorithmVersion: row.algorithm_version ?? undefined,
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

export async function getCaseStructuredDocument(
  supabase: SupabaseClient,
  caseId: string,
): Promise<{ document: StructuredCaseDocument | null; updatedAt: string | null; id: string | null }> {
  const { data, error } = await supabase
    .from("case_structured_documents")
    .select(
      "id,sections_json,editor_state_json,search_text,template_version,algorithm_version,physician_confirmed_conclusion,updated_at",
    )
    .eq("case_id", caseId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return { document: null, updatedAt: null, id: null };
    throw new Error(error.message);
  }

  if (!data) return { document: null, updatedAt: null, id: null };

  return {
    id: data.id,
    updatedAt: data.updated_at,
    document: rowToDocument(data),
  };
}

export async function upsertCaseStructuredDocument(
  supabase: SupabaseClient,
  input: {
    caseId: string;
    userId: string;
    body: unknown;
  },
): Promise<
  | { ok: true; document: StructuredCaseDocument; updatedAt: string; versionNumber: number }
  | { ok: false; conflict: true }
  | { ok: false; conflict: false; error: string }
> {
  const parsed = UpsertStructuredCaseBodySchema.safeParse(input.body);
  if (!parsed.success) {
    return { ok: false, conflict: false, error: "Invalid payload" };
  }

  const document = sanitizeCaseDocument(parsed.data.document);

  const { data: existing } = await supabase
    .from("case_structured_documents")
    .select("id,updated_at")
    .eq("case_id", input.caseId)
    .maybeSingle();

  if (
    parsed.data.expectedUpdatedAt &&
    existing?.updated_at &&
    existing.updated_at !== parsed.data.expectedUpdatedAt
  ) {
    return { ok: false, conflict: true };
  }

  const row = {
    case_id: input.caseId,
    user_id: input.userId,
    sections_json: document.sections,
    editor_state_json: document.editorState,
    search_text: document.searchText,
    template_version: document.templateVersion,
    algorithm_version: document.algorithmVersion ?? null,
    physician_confirmed_conclusion: document.physicianConfirmedConclusion,
    status: "draft" as const,
  };

  let documentId = existing?.id as string | undefined;

  if (documentId) {
    const { data: updated, error } = await supabase
      .from("case_structured_documents")
      .update(row)
      .eq("id", documentId)
      .eq("user_id", input.userId)
      .select("id,updated_at")
      .single();

    if (error) return { ok: false, conflict: false, error: error.message };
    documentId = updated.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("case_structured_documents")
      .insert(row)
      .select("id,updated_at")
      .single();

    if (error) return { ok: false, conflict: false, error: error.message };
    documentId = inserted.id;
  }

  const { count } = await supabase
    .from("case_structured_document_versions")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId);

  const versionNumber = (count ?? 0) + 1;

  if (!parsed.data.isAutosave || versionNumber === 1 || versionNumber % 5 === 0) {
    await supabase.from("case_structured_document_versions").insert({
      document_id: documentId,
      case_id: input.caseId,
      user_id: input.userId,
      version_number: versionNumber,
      sections_json: document.sections,
      editor_state_json: document.editorState,
      search_text: document.searchText,
      template_version: document.templateVersion,
      algorithm_version: document.algorithmVersion ?? null,
      change_summary: parsed.data.changeSummary ?? null,
    });
  }

  await supabase.from("case_structured_document_audit_events").insert({
    case_id: input.caseId,
    user_id: input.userId,
    event_type: parsed.data.isAutosave ? "autosave" : "save",
    version_number: versionNumber,
    meta: { templateVersion: document.templateVersion },
  });

  const { data: fresh } = await supabase
    .from("case_structured_documents")
    .select("updated_at")
    .eq("id", documentId)
    .single();

  return {
    ok: true,
    document: { ...document, lastSavedAt: fresh?.updated_at ?? new Date().toISOString() },
    updatedAt: fresh?.updated_at ?? new Date().toISOString(),
    versionNumber,
  };
}

export async function listCaseStructuredVersions(
  supabase: SupabaseClient,
  caseId: string,
): Promise<StructuredDocumentVersion[]> {
  const { data, error } = await supabase
    .from("case_structured_document_versions")
    .select("id,version_number,change_summary,template_version,algorithm_version,created_at")
    .eq("case_id", caseId)
    .order("version_number", { ascending: false })
    .limit(30);

  if (error) {
    safeLog("case structured versions error", { code: error.code });
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

export async function restoreCaseStructuredVersion(
  supabase: SupabaseClient,
  input: { caseId: string; userId: string; versionId: string },
): Promise<{ document: StructuredCaseDocument; updatedAt: string } | null> {
  const { data: versionRow, error } = await supabase
    .from("case_structured_document_versions")
    .select(
      "sections_json,editor_state_json,search_text,template_version,algorithm_version,document_id",
    )
    .eq("id", input.versionId)
    .eq("case_id", input.caseId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error || !versionRow) return null;

  const document = sanitizeCaseDocument(
    StructuredCaseDocumentSchema.parse({
      templateVersion: versionRow.template_version,
      algorithmVersion: versionRow.algorithm_version ?? undefined,
      sections: versionRow.sections_json,
      searchText: versionRow.search_text,
      editorState: versionRow.editor_state_json,
      physicianConfirmedConclusion: false,
    }),
  );

  const result = await upsertCaseStructuredDocument(supabase, {
    caseId: input.caseId,
    userId: input.userId,
    body: {
      document,
      changeSummary: "Восстановление версии",
      isAutosave: false,
    },
  });

  if (!result.ok) return null;

  await supabase.from("case_structured_document_audit_events").insert({
    case_id: input.caseId,
    user_id: input.userId,
    event_type: "version_restore",
    meta: { versionId: input.versionId },
  });

  return { document: result.document, updatedAt: result.updatedAt };
}
