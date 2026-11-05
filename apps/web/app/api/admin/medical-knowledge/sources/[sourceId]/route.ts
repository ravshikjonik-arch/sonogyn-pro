import { NextResponse } from "next/server";
import { z } from "zod";

import { requireClinicalRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

type Ctx = { params: Promise<{ sourceId: string }> };

const PatchSchema = z.object({
  action: z.enum(["approve_and_publish", "reject", "set_review_required"]),
  notes: z.string().max(2000).optional(),
});

/** Editor: list chunks (truncated) + publish/reject workflow. */
export async function GET(_request: Request, ctx: Ctx) {
  const { sourceId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = await requireClinicalRole(supabase, user.id, "author");
  if (!gate.ok) return gate.response;

  const { data: source, error } = await supabase
    .from("sources")
    .select(
      "id,title,source_type,year,organization,review_status,rag_allowed,quotation_allowed,license_notes,version,updated_at",
    )
    .eq("id", sourceId)
    .maybeSingle();

  if (error || !source) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
  }

  const { data: chunks } = await supabase
    .from("source_chunks")
    .select("id,chunk_index,section_title,review_status,token_count,content")
    .eq("source_id", sourceId)
    .order("chunk_index", { ascending: true })
    .limit(200);

  return NextResponse.json({
    source,
    chunks: (chunks ?? []).map((c) => ({
      ...c,
      contentPreview: String(c.content ?? "").slice(0, 400),
      content: undefined,
    })),
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { sourceId } = await ctx.params;
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
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const { data: source } = await supabase
    .from("sources")
    .select("id,version,review_status")
    .eq("id", sourceId)
    .maybeSingle();
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.action === "reject") {
    await supabase
      .from("sources")
      .update({ review_status: "archived", rag_allowed: false })
      .eq("id", sourceId);
    await supabase.from("medical_reviews").insert({
      entity_type: "source",
      entity_id: sourceId,
      reviewer_id: user.id,
      status: "rejected",
      notes: parsed.data.notes ?? "rejected in Source Studio",
      reviewed_at: new Date().toISOString(),
      source_version: source.version,
    });
    return NextResponse.json({ ok: true, reviewStatus: "archived" });
  }

  if (parsed.data.action === "set_review_required") {
    await supabase.from("sources").update({ review_status: "review_required" }).eq("id", sourceId);
    return NextResponse.json({ ok: true, reviewStatus: "review_required" });
  }

  // approve_and_publish — trigger requires approved medical_reviews for version
  const { error: reviewErr } = await supabase.from("medical_reviews").insert({
    entity_type: "source",
    entity_id: sourceId,
    reviewer_id: user.id,
    status: "approved",
    notes: parsed.data.notes ?? "approved in Source Studio",
    reviewed_at: new Date().toISOString(),
    source_version: source.version,
  });
  if (reviewErr) {
    return NextResponse.json({ error: reviewErr.message }, { status: 400 });
  }

  const { error: pubErr } = await supabase
    .from("sources")
    .update({
      review_status: "published",
      rag_allowed: true,
      quotation_allowed: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", sourceId);

  if (pubErr) {
    return NextResponse.json({ error: pubErr.message }, { status: 400 });
  }

  await supabase
    .from("source_chunks")
    .update({ review_status: "published" })
    .eq("source_id", sourceId);

  return NextResponse.json({
    ok: true,
    reviewStatus: "published",
    ragAllowed: true,
    note: "Для semantic vault: embed chunks (см. MEDICAL_VAULT_EMBED_RUNBOOK) + EVIDENCE_MEDICAL_VAULT=1",
  });
}
