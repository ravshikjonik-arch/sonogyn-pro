#!/usr/bin/env node
/**
 * Monitor RF regulation sources → regulation_ingest_queue (dedupe by content_hash).
 *
 * Usage (from apps/web):
 *   node scripts/ingest-rf-regulations.mjs --dry-run
 *   node scripts/ingest-rf-regulations.mjs
 */
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

const RELEVANCE_KEYWORDS = [
  "акушер",
  "гинекол",
  "узи",
  "ультразвук",
  "беремен",
  "шейк",
  "матк",
  "яичник",
  "молочн",
  "мамм",
  "пренатал",
  "плод",
  "эндометри",
  "миом",
  "скрининг",
  "фетом",
  "допплер",
  "o-rads",
  "bi-rads",
  "isuog",
  "исуог",
  "клиническ рекоменд",
];

function isRelevant(title, snippet, alwaysInclude) {
  if (alwaysInclude) return true;
  const hay = `${title} ${snippet || ""}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some((k) => hay.includes(k));
}

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

function sha256(parts) {
  const h = createHash("sha256");
  for (const p of parts) h.update(String(p));
  h.update("\0");
  return h.digest("hex");
}

function decodeXml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html) {
  return decodeXml(html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchText(url, maxBytes = 120_000) {
  const res = await fetch(url, {
    headers: { "User-Agent": "SonoGynRegulationMonitor/1.0 (+https://sonogyn-pro.ru)" },
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.slice(0, maxBytes).toString("utf8");
}

async function collectFromSource(source) {
  const rows = [];

  if (source.type === "static_urls" && Array.isArray(source.urls)) {
    for (const item of source.urls) {
      const title = item.title || item.url;
      const snippet = item.snippet || `Мониторинг: ${title}`;
      rows.push({
        external_id: item.externalId || sha256([item.url]),
        source_url: item.url,
        title,
        raw_snippet: snippet.slice(0, 8000),
        document_kind: source.documentKind || null,
      });
    }
    return rows;
  }

  if (source.type === "html_links" && source.url) {
    const html = await fetchText(source.url);
    const base = new URL(source.url);
    const pattern = new RegExp(source.linkPattern || 'href="([^"]+)"', "gi");
    const seen = new Set();
    let m;
    const max = source.maxLinks ?? 20;
    while ((m = pattern.exec(html)) && rows.length < max) {
      let href = m[1];
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
      if (href.startsWith("/")) href = `${base.origin}${href}`;
      if (!href.startsWith("http") || seen.has(href)) continue;
      seen.add(href);
      const title = href.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || href;
      rows.push({
        external_id: sha256([source.id, href]).slice(0, 32),
        source_url: href,
        title: title.slice(0, 300),
        raw_snippet: stripHtml(html).slice(0, 500),
        document_kind: source.documentKind || null,
      });
    }
    return rows;
  }

  if (source.type === "rss" && source.url) {
    const xml = await fetchText(source.url);
    const blocks = xml.split("<item>").slice(1);
    for (const block of blocks.slice(0, source.maxItems ?? 25)) {
      const title = decodeXml(block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "");
      const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() || "";
      const desc = stripHtml(block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || "");
      if (!link || !title) continue;
      rows.push({
        external_id: sha256([link, title]).slice(0, 32),
        source_url: link,
        title: title.slice(0, 500),
        raw_snippet: desc.slice(0, 8000),
        document_kind: source.documentKind || null,
      });
    }
    return rows;
  }

  console.warn(`Unknown source type: ${source.type} (${source.id})`);
  return rows;
}

async function main() {
  const env = {
    ...loadEnv(path.join(webRoot, ".env.local")),
    ...process.env,
  };
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dryRun && (!url || !key)) {
    console.error("Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or --dry-run)");
    process.exit(1);
  }

  const configPath = path.join(webRoot, "config/rf-regulation-sources.json");
  const sources = JSON.parse(fs.readFileSync(configPath, "utf8"));

  let discovered = 0;
  let inserted = 0;
  let skipped = 0;

  const admin = dryRun ? null : createClient(url, key, { auth: { persistSession: false } });

  for (const source of sources) {
    console.log(`\n— ${source.name} (${source.id})`);
    let rows;
    try {
      rows = await collectFromSource(source);
    } catch (e) {
      console.error("  fetch failed:", e instanceof Error ? e.message : e);
      continue;
    }
    const alwaysInclude = source.filterRelevance === false || source.type === "static_urls";
    for (const row of rows) {
      if (!isRelevant(row.title, row.raw_snippet || "", alwaysInclude)) {
        skipped += 1;
        continue;
      }
      discovered += 1;
      const content_hash = sha256([row.source_url, row.title, row.raw_snippet?.slice(0, 500) || ""]);
      const payload = {
        source: source.id,
        external_id: row.external_id,
        source_url: row.source_url,
        title: row.title,
        content_hash,
        raw_snippet: row.raw_snippet,
        document_kind: row.document_kind,
        status: "pending_extraction",
        updated_at: new Date().toISOString(),
      };

      if (dryRun) {
        console.log("  [dry-run]", row.title.slice(0, 60));
        inserted += 1;
        continue;
      }

      const { data: existing } = await admin
        .from("regulation_ingest_queue")
        .select("id")
        .eq("source", source.id)
        .eq("content_hash", content_hash)
        .maybeSingle();

      if (existing?.id) {
        skipped += 1;
        continue;
      }

      const { error } = await admin.from("regulation_ingest_queue").upsert(payload, {
        onConflict: "source,external_id",
        ignoreDuplicates: false,
      });

      if (error) {
        if (error.code === "23505") {
          skipped += 1;
          continue;
        }
        console.error("  insert error:", error.message);
        continue;
      }
      inserted += 1;
      console.log("  +", row.title.slice(0, 70));
    }
  }

  console.log(`\nDone. discovered=${discovered} new_or_updated=${inserted} skipped_dup=${skipped} dryRun=${dryRun}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
