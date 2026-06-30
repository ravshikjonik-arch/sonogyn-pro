#!/usr/bin/env node
/**
 * Ingest NICE published guidance atom feed → guidelines_external_index (Supabase).
 *
 * Usage (from apps/web):
 *   node scripts/ingest-external-guidelines.mjs --dry-run
 *   node scripts/ingest-external-guidelines.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
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

function decodeXml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseNiceAtom(xml) {
  const entries = [];
  const blocks = xml.split("<entry>").slice(1);
  for (const block of blocks) {
    const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const linkMatch = block.match(/<link[^>]*href="([^"]+)"/);
    const updatedMatch = block.match(/<updated>([^<]+)<\/updated>/);
    const summaryMatch = block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    const idMatch = block.match(/<id>([^<]+)<\/id>/);
    if (!titleMatch?.[1] || !linkMatch?.[1]) continue;

    const href = linkMatch[1];
    const slugMatch = href.match(/\/guidance\/([a-z0-9]+)/i);
    entries.push({
      source: "nice",
      external_id: slugMatch?.[1] || idMatch?.[1]?.split("/").pop() || href,
      title: decodeXml(titleMatch[1].trim()),
      url: href.startsWith("http") ? href : `https://www.nice.org.uk${href}`,
      body_text: summaryMatch?.[1] ? decodeXml(summaryMatch[1].replace(/<[^>]+>/g, " ").trim()) : null,
      published_at: updatedMatch?.[1] || null,
    });
  }
  return entries;
}

function seedJsonPath() {
  return path.join(webRoot, "../../packages/evidence-retrieval/data/external-guidelines.seed.json");
}

function loadSeedRows(sourceFilter) {
  const seedPath = seedJsonPath();
  if (!fs.existsSync(seedPath)) return [];
  const raw = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  return raw
    .filter((r) => !sourceFilter || r.source === sourceFilter)
    .map((r) => ({
      source: r.source,
      external_id: r.externalId,
      title: r.title,
      url: r.url,
      body_text: r.summary ?? null,
      published_at: r.year ? `${r.year}-01-01T00:00:00Z` : null,
    }));
}

function loadWhoSeed() {
  return loadSeedRows("who");
}

function loadEmaSeed() {
  return loadSeedRows("ema");
}

async function main() {
  console.log("\n📥 Ingest external guidelines (NICE atom + WHO seed)\n");

  const env = {
    ...loadEnv(path.join(webRoot, ".env.local.save")),
    ...loadEnv(path.join(webRoot, ".env.local")),
    ...process.env,
  };
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const atomUrls = [
    "https://www.nice.org.uk/guidance/published?format=atom",
    "https://www.nice.org.uk/guidance/published.atom",
  ];
  let niceRows = [];
  for (const atomUrl of atomUrls) {
    const atomRes = await fetch(atomUrl, { headers: { Accept: "application/atom+xml" } });
    if (atomRes.ok) {
      niceRows = parseNiceAtom(await atomRes.text()).slice(0, 120);
      break;
    }
  }
  if (niceRows.length === 0) {
    console.warn("NICE atom unavailable — using seed NICE rows only");
    niceRows = loadSeedRows("nice");
  }
  const whoRows = loadWhoSeed();
  const emaRows = loadEmaSeed();
  const rows = [...niceRows, ...whoRows, ...emaRows];

  console.log(`NICE: ${niceRows.length}, WHO: ${whoRows.length}, EMA: ${emaRows.length}, total: ${rows.length}`);

  if (dryRun) {
    console.log("\nDry-run sample:");
    for (const r of rows.slice(0, 5)) console.log(` · [${r.source}] ${r.title.slice(0, 70)}`);
    console.log("\nDry-run OK\n");
    return;
  }

  if (!url || !serviceKey) {
    console.error("Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let upserted = 0;
  for (const chunk of chunkArray(rows, 50)) {
    const { error } = await admin.from("guidelines_external_index").upsert(
      chunk.map((r) => ({
        source: r.source,
        external_id: r.external_id,
        title: r.title,
        url: r.url,
        body_text: r.body_text,
        published_at: r.published_at,
        synced_at: new Date().toISOString(),
      })),
      { onConflict: "source,external_id" },
    );
    if (error) {
      console.error("Upsert error:", error.message);
      process.exit(1);
    }
    upserted += chunk.length;
  }

  console.log(`\n✅ Upserted ${upserted} rows into guidelines_external_index\n`);
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
