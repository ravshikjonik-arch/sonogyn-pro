import { hashSourceContent, sanitizeMedicalSource } from "@repo/medical-knowledge";
import type { SupabaseClient } from "@supabase/supabase-js";

import { chunkPlainText } from "@/lib/medical-knowledge/chunk-plain-text";

export type CreateReviewSourceInput = {
  title: string;
  text: string;
  sourceType?:
    | "book"
    | "guideline"
    | "consensus"
    | "article"
    | "manual"
    | "protocol"
    | "lecture"
    | "other";
  language?: string;
  organization?: string | null;
  year?: number | null;
  licenseNotes: string;
  copyrightStatus: string;
  externalUrl?: string | null;
  quotationAllowed?: boolean;
};

export type CreateReviewSourceResult =
  | {
      ok: true;
      sourceId: string;
      title: string;
      chunkCount: number;
      requiresManualReview: boolean;
      sanitizationLog: string[];
    }
  | { ok: false; error: string; status: number };

/** Shared path: sanitize → chunk → sources + source_chunks as review_required (never publish). */
export async function createReviewRequiredSource(
  supabase: SupabaseClient,
  input: CreateReviewSourceInput,
): Promise<CreateReviewSourceResult> {
  const sanitized = sanitizeMedicalSource(input.text);
  const chunks = chunkPlainText(sanitized.cleanText);
  if (chunks.length === 0) {
    return { ok: false, error: "После очистки текст пуст.", status: 400 };
  }

  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .insert({
      title: input.title.trim(),
      organization: input.organization?.trim() || null,
      year: input.year ?? null,
      source_type: input.sourceType ?? "guideline",
      language: input.language ?? "ru",
      license_notes: input.licenseNotes,
      copyright_status: input.copyrightStatus,
      external_url: input.externalUrl?.trim() || null,
      rag_allowed: false,
      quotation_allowed: Boolean(input.quotationAllowed),
      review_status: "review_required",
      version: "1.0.0",
    })
    .select("id,title,review_status")
    .single();

  if (sourceError || !source) {
    return {
      ok: false,
      error: sourceError?.message ?? "Не удалось создать source (миграция vault?).",
      status: 400,
    };
  }

  const rows = chunks.map((c) => ({
    source_id: source.id,
    section_title: c.sectionTitle,
    chunk_index: c.chunkIndex,
    content: c.content,
    sanitized_content: c.content,
    content_hash: hashSourceContent(c.content),
    token_count: Math.ceil(c.content.length / 4),
    review_status: "review_required" as const,
  }));

  const { error: chunkError } = await supabase.from("source_chunks").insert(rows);
  if (chunkError) {
    return {
      ok: false,
      error: `Source создан (${source.id}), chunks error: ${chunkError.message}`,
      status: 400,
    };
  }

  return {
    ok: true,
    sourceId: source.id,
    title: source.title,
    chunkCount: rows.length,
    requiresManualReview: sanitized.requiresManualReview,
    sanitizationLog: sanitized.sanitizationLog,
  };
}
