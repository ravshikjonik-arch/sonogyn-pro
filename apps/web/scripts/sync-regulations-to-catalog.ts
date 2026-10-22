#!/usr/bin/env node
/**
 * Pull published regulation extractions → packages/clinical-guidelines/.../ingested-regulations.json
 *
 * Usage (from repo root):
 *   pnpm sync:regulations-catalog
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { draftEnvelopeToClinicalGuideline } from "../lib/regulations/draft-to-clinical-guideline";
import { regulationExtractionEnvelopeSchema } from "../lib/regulations/extraction-schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const repoRoot = path.join(webRoot, "..", "..");
const outPath = path.join(
  repoRoot,
  "packages/clinical-guidelines/src/catalog/ingested-regulations.json",
);

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

async function main() {
  const env = { ...loadEnv(path.join(webRoot, ".env.local")), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local");
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const { data: rows, error } = await admin
    .from("regulation_ingest_queue")
    .select("id, source_url, status")
    .eq("status", "published");

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const guidelines: unknown[] = [];
  for (const row of rows ?? []) {
    const { data: ex } = await admin
      .from("regulation_extractions")
      .select("extracted_json")
      .eq("queue_id", row.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ex?.extracted_json) continue;
    try {
      const envelope = regulationExtractionEnvelopeSchema.parse(ex.extracted_json);
      guidelines.push(
        draftEnvelopeToClinicalGuideline(envelope, {
          queueId: row.id,
          sourceUrl: row.source_url,
        }),
      );
    } catch {
      console.warn("Skip invalid extraction", row.id);
    }
  }

  fs.writeFileSync(outPath, `${JSON.stringify(guidelines, null, 2)}\n`, "utf8");
  console.log(`Wrote ${guidelines.length} guideline(s) → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
