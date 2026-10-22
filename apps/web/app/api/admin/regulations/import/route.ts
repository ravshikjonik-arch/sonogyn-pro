import { NextResponse } from "next/server";
import { z } from "zod";

import { regulationContentHash } from "@/lib/regulations/content-hash";
import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

const bodySchema = z.object({
  sourceUrl: z.string().url(),
  title: z.string().min(3).max(500).optional(),
  rawText: z.string().min(40).max(100_000).optional(),
  source: z.string().min(2).max(64).default("manual_import"),
  documentKind: z.string().max(64).optional(),
});

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = await requireAdminRole(supabase, user.id);
  if (!gate.ok) return gate.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let title = body.title;
  let rawSnippet = body.rawText;

  if (!rawSnippet) {
    try {
      const res = await fetch(body.sourceUrl, {
        headers: { "User-Agent": "SonoGynRegulationImport/1.0" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 422 });
      }
      const html = (await res.text()).slice(0, 120_000);
      rawSnippet = stripHtml(html).slice(0, 12_000);
      if (!title) {
        const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        title = m?.[1]?.trim() || body.sourceUrl;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: msg }, { status: 422 });
    }
  }

  if (!title) title = body.sourceUrl;
  if (!rawSnippet || rawSnippet.length < 40) {
    return NextResponse.json({ error: "Не удалось получить текст документа" }, { status: 422 });
  }

  const external_id = regulationContentHash([body.source, body.sourceUrl]).slice(0, 32);
  const content_hash = regulationContentHash([body.sourceUrl, title, rawSnippet.slice(0, 500)]);

  const { data, error } = await supabase
    .from("regulation_ingest_queue")
    .upsert(
      {
        source: body.source,
        external_id,
        source_url: body.sourceUrl,
        title,
        content_hash,
        raw_snippet: rawSnippet,
        document_kind: body.documentKind ?? null,
        status: "pending_extraction",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "source,external_id" },
    )
    .select("id, title, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: data });
}
