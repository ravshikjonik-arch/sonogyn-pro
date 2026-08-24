import { NextResponse } from "next/server";

import { fetchPubmedArticles } from "@/lib/pubmed/ncbi-client";
import { PubmedPmidQuerySchema, zodErrorResponse } from "@/lib/security/api-body-schemas";
import { rejectIfRateLimited } from "@/lib/security/api-rate-limit";

const MAX_PMIDS = 12;

/**
 * GET /api/pubmed/abstracts?pmid=123,456
 * Метаданные статей из PubMed (NCBI esummary). Без полного текста abstract — только title/journal/year.
 */
export async function GET(req: Request) {
  const limited = await rejectIfRateLimited(req, "pubmed-abstracts", 60, 60_000);
  if (limited) return limited;

  const url = new URL(req.url);
  const parsed = PubmedPmidQuerySchema.safeParse({
    pmid: url.searchParams.get("pmid") ?? "",
  });
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const pmids = parsed.data.pmid
    .split(/[,\s]+/)
    .map((p) => p.replace(/\D/g, ""))
    .filter(Boolean)
    .slice(0, MAX_PMIDS);

  if (pmids.length === 0) {
    return NextResponse.json({ error: "Укажите pmid=123 или pmid=123,456" }, { status: 400 });
  }

  try {
    const articles = await fetchPubmedArticles(pmids);
    return NextResponse.json(
      { articles, attribution: "Data from PubMed/NCBI" },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "PubMed fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
