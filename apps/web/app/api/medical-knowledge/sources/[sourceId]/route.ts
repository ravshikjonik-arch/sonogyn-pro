import { NextResponse } from "next/server";

import { SourceCitationPublicSchema, TEST_GUIDELINE_SOURCE } from "@repo/medical-knowledge";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { rateLimitKeyFromRequest } from "@/lib/security/request-client";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

type Params = { sourceId: string };

/** Public bibliographic card — never returns storage_path or chunk text. */
export async function GET(request: Request, context: { params: Promise<Params> }) {
  const rl = await consumeRateLimit(
    rateLimitKeyFromRequest(request, "medical-knowledge-source"),
    RL.evidenceAssistant.limit,
    RL.evidenceAssistant.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  }

  const { sourceId } = await context.params;
  if (!isUuid(sourceId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("source_catalog_public")
    .select("*")
    .eq("id", sourceId)
    .maybeSingle();

  if (!error && data) {
    const mapped = SourceCitationPublicSchema.safeParse({
      id: data.id,
      title: data.title,
      shortTitle: data.short_title,
      authors: data.authors,
      organization: data.organization,
      publisher: data.publisher,
      edition: data.edition,
      year: data.year,
      isbn: data.isbn,
      doi: data.doi,
      externalUrl: data.external_url,
      sourceType: data.source_type,
      language: data.language,
      reviewStatus: data.review_status,
      version: data.version,
    });
    if (mapped.success) {
      return NextResponse.json({ source: mapped.data });
    }
  }

  if (sourceId === TEST_GUIDELINE_SOURCE.id) {
    return NextResponse.json({ source: TEST_GUIDELINE_SOURCE });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
