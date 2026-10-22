import { NextResponse } from "next/server";
import { z } from "zod";

import { extractRegulationWithLlm } from "@/lib/regulations/extract-with-llm";
import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

const bodySchema = z.object({
  queueId: z.string().uuid(),
});

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

  const { data: row, error: fetchError } = await supabase
    .from("regulation_ingest_queue")
    .select("id, title, source_url, raw_snippet, status")
    .eq("id", body.queueId)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
  }

  const rawText = row.raw_snippet?.trim() || "";
  if (rawText.length < 40) {
    return NextResponse.json(
      { error: "Недостаточно текста для извлечения. Добавьте фрагмент вручную или обновите источник." },
      { status: 422 },
    );
  }

  const result = await extractRegulationWithLlm({
    title: row.title,
    sourceUrl: row.source_url,
    rawText,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const { envelope, model } = result;

  const { data: extraction, error: insertError } = await supabase
    .from("regulation_extractions")
    .insert({
      queue_id: row.id,
      extracted_json: envelope,
      model,
      confidence: envelope.confidence,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("regulation_ingest_queue")
    .update({ status: "in_review", updated_at: new Date().toISOString() })
    .eq("id", row.id);

  return NextResponse.json({
    ok: true,
    extractionId: extraction.id,
    confidence: envelope.confidence,
    draftTitle: envelope.draft.title,
  });
}
