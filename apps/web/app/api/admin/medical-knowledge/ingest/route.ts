import { NextResponse } from "next/server";
import { z } from "zod";

import { createReviewRequiredSource } from "@/lib/medical-knowledge/create-review-source";
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
      { error: "Нужны title и text (40–200000 символов). PDF — через «Импорт по ссылке» или Docling." },
      { status: 400 },
    );
  }

  const result = await createReviewRequiredSource(supabase, {
    title: parsed.data.title,
    text: parsed.data.text,
    sourceType: parsed.data.sourceType,
    language: parsed.data.language,
    organization: parsed.data.organization,
    year: parsed.data.year,
    externalUrl: parsed.data.externalUrl?.trim() || null,
    copyrightStatus: "editor_submitted",
    quotationAllowed: false,
    licenseNotes: parsed.data.licenseNotes?.trim() || "editor_text_ingest; verify license before publish",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    sourceId: result.sourceId,
    title: result.title,
    reviewStatus: "review_required",
    chunkCount: result.chunkCount,
    requiresManualReview: result.requiresManualReview,
    sanitizationLog: result.sanitizationLog,
    next: "Откройте Source Studio → проверьте чанки → Publish (после approved review).",
  });
}
