#!/usr/bin/env node
/**
 * Opt-in: embed published/rag_allowed vault chunks → source_chunks.embedding (1536).
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   OPENROUTER_API_KEY or OPENAI_API_KEY
 * Optional: EMBED_LIMIT=20, DRY_RUN=1
 *
 * Does NOT apply SQL migrations. Run after 20261104140000_medical_vault_pgvector.sql.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dry = process.env.DRY_RUN === "1";
const limit = Number.parseInt(process.env.EMBED_LIMIT ?? "20", 10) || 20;

function embeddingApi() {
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter) {
    const base = (process.env.OPENROUTER_API_URL?.trim() || "https://openrouter.ai/api/v1")
      .replace(/\/chat\/completions$/, "")
      .replace(/\/$/, "");
    return {
      url: `${base}/embeddings`,
      key: openrouter,
      model: process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "openai/text-embedding-3-small",
      openrouter: true,
    };
  }
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    return {
      url: "https://api.openai.com/v1/embeddings",
      key: openai,
      model: process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small",
      openrouter: false,
    };
  }
  return null;
}

async function embedText(api, text) {
  const res = await fetch(api.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${api.key}`,
      "Content-Type": "application/json",
      ...(api.openrouter
        ? {
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://sonogyn.pro",
            "X-Title": "SonoGyn vault embed",
          }
        : {}),
    },
    body: JSON.stringify({ model: api.model, input: text.slice(0, 8000) }),
  });
  if (!res.ok) {
    throw new Error(`embed HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = await res.json();
  const vector = json?.data?.[0]?.embedding;
  if (!Array.isArray(vector) || vector.length !== 1536) {
    throw new Error(`expected 1536-dim embedding, got ${vector?.length}`);
  }
  return vector;
}

async function main() {
  if (!url || !key) {
    console.error("FAIL: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required");
    process.exit(1);
  }
  const api = embeddingApi();
  if (!api) {
    console.error("FAIL: OPENROUTER_API_KEY or OPENAI_API_KEY required");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error } = await supabase
    .from("source_chunks")
    .select("id, content, sanitized_content, sources!inner(id, title, rag_allowed, review_status)")
    .is("embedding", null)
    .in("review_status", ["published", "reviewed", "extracted"])
    .eq("sources.rag_allowed", true)
    .eq("sources.review_status", "published")
    .limit(limit);

  if (error) {
    console.error("FAIL list chunks:", error.message);
    process.exit(1);
  }

  const list = rows ?? [];
  console.log(`candidates: ${list.length} (limit ${limit})${dry ? " DRY_RUN" : ""}`);

  let updated = 0;
  for (const row of list) {
    const text = (row.sanitized_content || row.content || "").trim();
    if (text.length < 20) {
      console.log("skip short", row.id);
      continue;
    }
    const vector = await embedText(api, text);
    if (dry) {
      console.log("dry would embed", row.id, "dims", vector.length);
      updated += 1;
      continue;
    }
    const { error: upErr } = await supabase
      .from("source_chunks")
      .update({ embedding: vector })
      .eq("id", row.id);
    if (upErr) {
      console.error("FAIL update", row.id, upErr.message);
      process.exit(1);
    }
    updated += 1;
    console.log("embedded", row.id);
  }

  console.log(`ok embedded ${updated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
