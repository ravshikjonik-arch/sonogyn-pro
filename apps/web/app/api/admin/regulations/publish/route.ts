import { NextResponse } from "next/server";
import { z } from "zod";

import {
  clinicalGuidelineToTsModule,
  draftEnvelopeToClinicalGuideline,
  externalIndexRowFromGuideline,
} from "@/lib/regulations/draft-to-clinical-guideline";
import { regulationExtractionEnvelopeSchema } from "@/lib/regulations/extraction-schema";
import { requireAdminRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";

const bodySchema = z.object({
  queueId: z.string().uuid(),
  extractionId: z.string().uuid(),
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

  const { data: row } = await supabase
    .from("regulation_ingest_queue")
    .select("id, title, source_url, status")
    .eq("id", body.queueId)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
  if (row.status !== "approved") {
    return NextResponse.json(
      { error: "Сначала одобрите черновик (статус approved), затем публикуйте." },
      { status: 422 },
    );
  }

  const { data: extraction } = await supabase
    .from("regulation_extractions")
    .select("id, extracted_json")
    .eq("id", body.extractionId)
    .eq("queue_id", body.queueId)
    .maybeSingle();

  if (!extraction) {
    return NextResponse.json({ error: "Extraction not found" }, { status: 404 });
  }

  let envelope;
  try {
    envelope = regulationExtractionEnvelopeSchema.parse(extraction.extracted_json);
  } catch {
    return NextResponse.json({ error: "Invalid stored extraction JSON" }, { status: 500 });
  }

  const guideline = draftEnvelopeToClinicalGuideline(envelope, {
    queueId: row.id,
    sourceUrl: row.source_url,
  });

  const admin = createServiceRoleClient();
  const indexRow = externalIndexRowFromGuideline(guideline, row.id);
  const { error: indexError } = await admin.from("guidelines_external_index").upsert(
    {
      ...indexRow,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "source,external_id" },
  );

  if (indexError) {
    return NextResponse.json({ error: indexError.message }, { status: 500 });
  }

  await supabase
    .from("regulation_ingest_queue")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", row.id);

  return NextResponse.json({
    ok: true,
    guidelineId: guideline.id,
    evidenceSource: "rf_regulation",
    tsModule: clinicalGuidelineToTsModule(guideline),
    hint: "Скопируйте tsModule в packages/clinical-guidelines или запустите pnpm sync:regulations-catalog локально.",
  });
}
