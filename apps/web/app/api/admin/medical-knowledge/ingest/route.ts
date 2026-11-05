import { NextResponse } from "next/server";
import { z } from "zod";

import { hashSourceContent, sanitizeMedicalSource } from "@repo/medical-knowledge";

import { chunkPlainText } from "@/lib/medical-knowledge/chunk-plain-text";
import { requireClinicalRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  title: z.string().min(3).max(300),
  sourceType: z
    .enum(["book", "guideline", "consensus", "article", "manual", "protocol", "lecture", "other"])
    .default("manual"),
  language: z.string().min(2).max(8).default("ru"),
  organization: z.string().max(200).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  licenseNotes: z.string().max(2000).optional(),
  externalUrl: z.string().url().optional().or(z.literal("")),
  text: z.string().min(40).max(200_000),
});

/**
 * P1-1: editor text ingest → sources + sanitized chunks (review_required).
 * No PDF/OCR here. Does not publish or enable RAG.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = await requireClinicalRole(supabase, user.id, "author");
  if (!gate.ok) return gate.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Нужны title и text (40–200000 символов). PDF/сканы — пока не через этот API." },
      { status: 400 },
    );
  }

  const sanitized = sanitizeMedicalSource(parsed.data.text);
  const chunks = chunkPlainText(sanitized.cleanText);
  if (chunks.length === 0) {
    return NextResponse.json({ error: "После очистки текст пуст." }, { status: 400 });
  }

  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .insert({
      title: parsed.data.title.trim(),
      organization: parsed.data.organization?.trim() || null,
      year: parsed.data.year ?? null,
      source_type: parsed.data.sourceType,
      language: parsed.data.language,
      license_notes: parsed.data.licenseNotes?.trim() || "editor_text_ingest; verify license before publish",
      copyright_status: "editor_submitted",
      external_url: parsed.data.externalUrl?.trim() || null,
      rag_allowed: false,
      quotation_allowed: false,
      review_status: "review_required",
      version: "1.0.0",
    })
    .select("id,title,review_status")
    .single();

  if (sourceError || !source) {
    return NextResponse.json(
      { error: sourceError?.message ?? "Не удалось создать source (миграция vault?)." },
      { status: 400 },
    );
  }

  const rows = chunks.map((c) => {
    const contentHash = hashSourceContent(c.content);
    return {
      source_id: source.id,
      section_title: c.sectionTitle,
      chunk_index: c.chunkIndex,
      content: c.content,
      sanitized_content: c.content,
      content_hash: contentHash,
      token_count: Math.ceil(c.content.length / 4),
      review_status: "review_required" as const,
    };
  });

  const { error: chunkError } = await supabase.from("source_chunks").insert(rows);
  if (chunkError) {
    return NextResponse.json(
      { error: `Source создан (${source.id}), chunks error: ${chunkError.message}` },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    sourceId: source.id,
    title: source.title,
    reviewStatus: source.review_status,
    chunkCount: rows.length,
    requiresManualReview: sanitized.requiresManualReview,
    sanitizationLog: sanitized.sanitizationLog,
    next: "Откройте Source Studio → проверьте чанки → Publish (после approved review).",
  });
}
