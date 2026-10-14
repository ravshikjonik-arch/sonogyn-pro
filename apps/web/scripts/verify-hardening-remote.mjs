#!/usr/bin/env node
/**
 * Read-only check: hardening migrations applied on remote Supabase.
 * Uses SUPABASE_SERVICE_ROLE_KEY from .env.local — no secrets printed.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const envPath = process.argv.includes("--new")
  ? path.join(webRoot, ".env.supabase-new")
  : path.join(webRoot, ".env.local");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = loadEnv(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const envLabel = envPath.endsWith(".env.supabase-new") ? ".env.supabase-new" : ".env.local";

if (!url || !key) {
  console.error(`❌ Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в apps/web/${envLabel}`);
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function probe(label, fn) {
  try {
    const result = await fn();
    console.log(`✅ ${label}`);
    return { ok: true, result };
  } catch (e) {
    console.log(`❌ ${label}: ${e.message}`);
    return { ok: false };
  }
}

async function main() {
  const projectRef = url.match(/https:\/\/([^.]+)/)?.[1] ?? "?";
  console.log(`\n🔍 Hardening probe · ${envLabel} · ref: ${projectRef}\n`);

  await probe("case_lifecycle_events.request_id column", async () => {
    const { error } = await supabase.from("case_lifecycle_events").select("request_id").limit(1);
    if (error) throw new Error(error.message);
  });

  await probe("clinical_platform_audit_events table", async () => {
    const { error } = await supabase.from("clinical_platform_audit_events").select("id").limit(1);
    if (error) throw new Error(error.message);
  });

  await probe("protocol_structured_drafts.lifecycle_status column", async () => {
    const { error } = await supabase
      .from("protocol_structured_drafts")
      .select("lifecycle_status")
      .limit(1);
    if (error) throw new Error(error.message);
  });

  const { data, error } = await supabase.rpc("transition_case_lifecycle", {
    p_case_id: "00000000-0000-4000-8000-000000000001",
    p_action: "resolve",
  });
  if (error?.message?.includes("does not exist")) {
    console.log("❌ RPC transition_case_lifecycle (8-arg): function missing");
  } else if (error) {
    console.log(`✅ RPC transition_case_lifecycle exists (probe error expected: ${error.code ?? "ok"})`);
  } else {
    console.log("✅ RPC transition_case_lifecycle callable");
  }

  await probe("knowledge_links.meta column", async () => {
    const { error: metaError } = await supabase.from("knowledge_links").select("meta").limit(1);
    if (metaError) throw new Error(metaError.message);
  });

  await probe("knowledge_links nosology seed (≥20 rows)", async () => {
    const { count, error: countError } = await supabase
      .from("knowledge_links")
      .select("id", { count: "exact", head: true })
      .eq("from_type", "nosology");
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) < 20) throw new Error(`expected ≥20, got ${count ?? 0}`);
  });

  const { error: syncRpcError } = await supabase.rpc("sync_teaching_case_knowledge_links", {
    p_case_id: "00000000-0000-4000-8000-000000000001",
  });
  if (syncRpcError?.message?.includes("does not exist")) {
    console.log("❌ RPC sync_teaching_case_knowledge_links: function missing");
  } else if (syncRpcError) {
    console.log(
      `✅ RPC sync_teaching_case_knowledge_links exists (probe: ${syncRpcError.code ?? syncRpcError.message.slice(0, 40)})`,
    );
  } else {
    console.log("✅ RPC sync_teaching_case_knowledge_links callable");
  }

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
