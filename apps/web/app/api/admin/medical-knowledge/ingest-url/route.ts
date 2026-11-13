import { NextResponse } from "next/server";
import { z } from "zod";

import { createReviewRequiredSource } from "@/lib/medical-knowledge/create-review-source";
import { fetchAllowedSourceDocument } from "@/lib/medical-knowledge/fetch-allowed-source-url";
import { requireClinicalRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  url: z.string().url().max(2000),
  title: z.string().min(3).max(300).optional(),
  sourceType: z
    .enum(["book", "guideline", "consensus", "article", "manual", "protocol", "lecture", "other"])
    .default("guideline"),
  language: z.string().min(2).max(8).default("ru"),
  organization: z.string().max(200).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
});

/**
 * B1: allowlisted URL → download → extract text → vault as review_required.
 * Does not publish. Does not set rag_allowed. Scanned PDFs without text layer are rejected.
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
    return NextResponse.json({ error: "Нужен корректный url (https)." }, { status: 400 });
  }

  let doc;
  try {
    doc = await fetchAllowedSourceDocument(parsed.data.url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка загрузки";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const title =
    parsed.data.title?.trim() ||
    doc.titleHint ||
    `Импорт ${doc.contentKind.toUpperCase()} · ${new Date().toISOString().slice(0, 10)}`;

  const nc = Boolean(doc.policy.nonCommercial);
  const result = await createReviewRequiredSource(supabase, {
    title,
    text: doc.text,
    sourceType: parsed.data.sourceType,
    language: parsed.data.language,
    organization: parsed.data.organization,
    year: parsed.data.year,
    externalUrl: doc.url,
    copyrightStatus: nc ? "url_import_nc_check" : "url_import_open",
    quotationAllowed: !nc,
    licenseNotes: [
      `url_import:${doc.contentKind}`,
      doc.policy.note,
      `source=${doc.url}`,
      `bytes=${doc.bytes}`,
      nc ? "NON_COMMERCIAL: не включать rag_allowed без юр. проверки" : null,
    ]
      .filter(Boolean)
      .join("; "),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    sourceId: result.sourceId,
    title: result.title,
    chunkCount: result.chunkCount,
    contentKind: doc.contentKind,
    nonCommercial: nc,
    requiresManualReview: result.requiresManualReview,
    next: nc
      ? "Источник NC: проверьте чанки. Publish только после юр. решения (сейчас rag_allowed=false)."
      : "Откройте Source Studio → проверьте чанки → Publish.",
  });
}
