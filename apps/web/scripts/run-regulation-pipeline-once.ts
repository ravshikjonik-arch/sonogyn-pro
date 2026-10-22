#!/usr/bin/env node
/**
 * End-to-end smoke: extract → approve → publish for one queue row (service role).
 * Usage: node --import tsx scripts/run-regulation-pipeline-once.ts [queueId]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import {
  draftEnvelopeToClinicalGuideline,
  externalIndexRowFromGuideline,
} from "../lib/regulations/draft-to-clinical-guideline";
import { extractRegulationWithLlm } from "../lib/regulations/extract-with-llm";
import {
  regulationExtractionEnvelopeSchema,
  type RegulationExtractionEnvelope,
} from "../lib/regulations/extraction-schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");

function loadEnv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

function hubFallbackEnvelope(title: string, sourceUrl: string): RegulationExtractionEnvelope {
  return regulationExtractionEnvelopeSchema.parse({
    confidence: "medium",
    reviewNotesForEditor:
      "Индексная карточка рубрикатора (не отдельная КР). Тактику берите из конкретного документа на cr.minzdrav.gov.ru.",
    draft: {
      title,
      summary:
        "Федеральный рубрикатор клинических рекомендаций МЗ РФ: точка входа для поиска актуальных КР по акушерству, гинекологии и смежным областям. SonoGyn Pro использует одобренные выдержки после medical review.",
      shelf: "kr_mz_rf",
      documentKind: "clinical_recommendation",
      issuer: "mz_rf",
      specialty: "general",
      year: new Date().getFullYear(),
      officialUrl: sourceUrl,
      relevantSections: ["Рубрикатор КР МЗ РФ"],
      recommendations: [
        {
          clinical_guideline:
            "Перед клиническим решением откройте профильную КР на официальном рубрикаторе и сверьте редакцию/дату.",
          evidence_level: "unknown",
          applicable_to: ["guidelines"],
        },
      ],
      protocolChanges: [],
      contraindications: [],
      relatedNosologyIds: [],
    },
  });
}

async function main() {
  const env = { ...loadEnv(path.join(webRoot, ".env.local")), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Need SUPABASE URL + SERVICE_ROLE in apps/web/.env.local");
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const queueIdArg = process.argv[2];

  let query = admin
    .from("regulation_ingest_queue")
    .select("id, title, source_url, raw_snippet, status")
    .order("fetched_at", { ascending: false })
    .limit(1);

  if (queueIdArg) {
    query = admin
      .from("regulation_ingest_queue")
      .select("id, title, source_url, raw_snippet, status")
      .eq("id", queueIdArg)
      .limit(1);
  }

  const { data: row, error } = await query.maybeSingle();
  if (error || !row) {
    console.error("Queue row not found", error?.message);
    process.exit(1);
  }

  console.log("Queue:", row.id, row.status, row.title.slice(0, 60));

  const rawText = row.raw_snippet?.trim() || "";
  let envelope: RegulationExtractionEnvelope;
  let model = "rules:hub-fallback";

  const llmResult = await extractRegulationWithLlm({
    title: row.title,
    sourceUrl: row.source_url,
    rawText: rawText.length >= 40 ? rawText : `${row.title}. ${row.source_url}`,
  });

  if ("envelope" in llmResult) {
    envelope = llmResult.envelope;
    model = llmResult.model;
    console.log("Extract: LLM", model, envelope.confidence);
  } else {
    console.log("Extract: fallback (", llmResult.error, ")");
    envelope = hubFallbackEnvelope(row.title, row.source_url);
  }

  const { data: extraction, error: exErr } = await admin
    .from("regulation_extractions")
    .insert({
      queue_id: row.id,
      extracted_json: envelope,
      model,
      confidence: envelope.confidence,
      review_note: "Auto pipeline smoke (approved)",
      reviewed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (exErr) {
    console.error("insert extraction:", exErr.message);
    process.exit(1);
  }

  await admin
    .from("regulation_ingest_queue")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", row.id);

  const guideline = draftEnvelopeToClinicalGuideline(envelope, {
    queueId: row.id,
    sourceUrl: row.source_url,
  });
  const indexRow = externalIndexRowFromGuideline(guideline, row.id);

  const { error: idxErr } = await admin.from("guidelines_external_index").upsert(
    { ...indexRow, synced_at: new Date().toISOString() },
    { onConflict: "source,external_id" },
  );
  if (idxErr) {
    console.error("index upsert:", idxErr.message);
    process.exit(1);
  }

  await admin
    .from("regulation_ingest_queue")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", row.id);

  console.log("Published:", guideline.id, "→ guidelines_external_index (rf_regulation)");
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
