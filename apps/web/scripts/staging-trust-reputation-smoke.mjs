#!/usr/bin/env node
/**
 * Staging smoke: trust & reputation (Supabase schema + optional HTTP).
 * Env: apps/web/.env.local (Supabase URL + service role)
 *      apps/web/.env.staging-idor (STAGING_APP_URL, STAGING_SUPABASE_PROJECT_REF, IDOR_USER_A_*)
 * Does not print secrets.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const PROD_SUPABASE_REF = "grnwcbyslttbrqznnunq";

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

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
}

const local = loadEnv(path.join(webRoot, ".env.local"));
const staging = loadEnv(path.join(webRoot, ".env.staging-idor"));
const env = { ...local, ...staging, ...process.env };

const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const baseUrl = (env.STAGING_APP_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const stagingRef = (env.STAGING_SUPABASE_PROJECT_REF ?? "").trim();
const emailA = env.IDOR_USER_A_EMAIL?.trim();
const passwordA = env.IDOR_USER_A_PASSWORD?.trim();

if (!url || !serviceKey) {
  fail("Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local");
}

const urlRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "";
if (stagingRef && urlRef && stagingRef !== urlRef) {
  warn(`STAGING_SUPABASE_PROJECT_REF (${stagingRef}) ≠ URL ref (${urlRef}) — проверьте .env`);
}

if (urlRef === PROD_SUPABASE_REF && env.STAGING_ALLOW_PROD_DATABASE !== "YES_I_CONFIRM") {
  const host = (() => {
    try {
      return new URL(baseUrl).hostname;
    } catch {
      return "";
    }
  })();
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (!isLocal) {
    fail(
      `Supabase ref is production (${PROD_SUPABASE_REF}). Use localhost, a branch ref, or STAGING_ALLOW_PROD_DATABASE=YES_I_CONFIRM.`,
    );
  }
  warn("Prod Supabase + localhost: только read-only пробы, без записи тестовых заявок.");
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const results = { pass: 0, fail: 0, skip: 0 };

async function probe(label, fn, { optional = false } = {}) {
  try {
    await fn();
    console.log(`✅ ${label}`);
    results.pass += 1;
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (optional) {
      console.log(`⏭️  ${label} (optional): ${msg}`);
      results.skip += 1;
      return false;
    }
    console.log(`❌ ${label}: ${msg}`);
    results.fail += 1;
    return false;
  }
}

async function rpcExists(name) {
  const { error } = await admin.rpc(name, {});
  if (error?.message?.includes("does not exist")) {
    throw new Error("function missing");
  }
  return error?.code ?? "ok";
}

async function signIn(email, password) {
  const res = await fetch(`${baseUrl}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (!res.ok) throw new Error(`sign-in HTTP ${res.status}`);
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  const dashboardUrl = urlRef
    ? `https://supabase.com/dashboard/project/${urlRef}`
    : "https://supabase.com/dashboard/projects";

  console.log(`\n🔍 Trust & reputation staging smoke (real Supabase)`);
  console.log(`   Project ref : ${urlRef || "?"}`);
  console.log(`   API URL     : ${url || "—"}`);
  console.log(`   Dashboard   : ${dashboardUrl}`);
  console.log(`   App URL     : ${baseUrl}\n`);

  await probe("table doctor_verifications", async () => {
    const { error } = await admin.from("doctor_verifications").select("id").limit(1);
    if (error) throw new Error(error.message);
  });

  await probe("table reputation_events (+ actor_id)", async () => {
    const { error } = await admin.from("reputation_events").select("id,actor_id").limit(1);
    if (error) throw new Error(error.message);
  });

  await probe("table case_votes", async () => {
    const { error } = await admin.from("case_votes").select("case_id").limit(1);
    if (error) throw new Error(error.message);
  });

  await probe("profiles.is_verified / reputation / cases_count", async () => {
    const { error } = await admin
      .from("profiles")
      .select("id,is_verified,reputation,cases_count")
      .limit(1);
    if (error) throw new Error(error.message);
  });

  await probe("cases.vote_up_count / rating", async () => {
    const { error } = await admin.from("cases").select("id,vote_up_count,rating").limit(1);
    if (error) throw new Error(error.message);
  });

  await probe("Storage bucket verifications", async () => {
    const { data, error } = await admin.storage.listBuckets();
    if (error) throw new Error(error.message);
    const found = (data ?? []).some((b) => b.id === "verifications" || b.name === "verifications");
    if (!found) throw new Error("bucket verifications not found");
  });

  await probe("RPC recalculate_reputation", async () => {
    const { data: prof } = await admin.from("profiles").select("id").limit(1).maybeSingle();
    if (!prof?.id) throw new Error("no profiles row to probe");
    const { error } = await admin.rpc("recalculate_reputation", { p_user_id: prof.id });
    if (error?.message?.includes("does not exist")) throw new Error(error.message);
    if (error) throw new Error(error.message);
  });

  await probe("RPC review_doctor_verification (exists)", async () => {
    const code = await rpcExists("review_doctor_verification");
    if (code === "does not exist") throw new Error("missing");
  });

  await probe("RPC cast_case_vote (exists)", async () => {
    const code = await rpcExists("cast_case_vote");
    if (code === "does not exist") throw new Error("missing");
  });

  await probe("RPC apply_comment_thumb_reputation (exists)", async () => {
    const code = await rpcExists("apply_comment_thumb_reputation");
    if (code === "does not exist") throw new Error("missing");
  });

  await probe("RPC backfill_all_reputation (exists)", async () => {
    const code = await rpcExists("backfill_all_reputation");
    if (code === "does not exist") throw new Error("missing");
  });

  if (emailA && passwordA) {
    console.log("\n— HTTP (authenticated user A) —\n");

    let cookie;
    try {
      cookie = await signIn(emailA, passwordA);
      console.log("✅ POST /api/auth/sign-in (user A)");
      results.pass += 1;
    } catch (e) {
      fail(`HTTP sign-in: ${e instanceof Error ? e.message : e}`);
    }

    await probe(
      "GET /api/verify/status",
      async () => {
        const res = await fetch(`${baseUrl}/api/verify/status`, { headers: { Cookie: cookie } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (typeof body.is_verified !== "boolean") throw new Error("invalid JSON shape");
      },
      { optional: false },
    );

    await probe(
      "GET /api/cases?limit=1",
      async () => {
        const res = await fetch(`${baseUrl}/api/cases?limit=1`, { headers: { Cookie: cookie } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      },
      { optional: true },
    );

    await probe(
      "POST /api/cases/{id}/vote contract",
      async () => {
        const listRes = await fetch(`${baseUrl}/api/cases?limit=1`, { headers: { Cookie: cookie } });
        if (!listRes.ok) throw new Error(`cases list HTTP ${listRes.status}`);
        const list = await listRes.json();
        const caseId = list?.cases?.[0]?.id;
        if (!caseId) {
          throw new Error("no cases — skip vote probe");
        }
        const voteRes = await fetch(`${baseUrl}/api/cases/${caseId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ vote: 1 }),
        });
        if (voteRes.status === 403) {
          console.log("   ℹ️  403 expected if user A не verified — включите /verify flow");
          return;
        }
        if (!voteRes.ok) throw new Error(`HTTP ${voteRes.status}`);
      },
      { optional: true },
    );
  } else {
    warn("IDOR_USER_A_* не заданы — HTTP пропущен (только Supabase probes)");
    results.skip += 1;
  }

  console.log(`\n— Summary: ${results.pass} passed, ${results.fail} failed, ${results.skip} skipped —\n`);

  if (results.fail > 0) {
    console.error(
      [
        "Схема trust не совпадает с кодом. Варианты:",
        "  1) cd apps/web && npm run db:migrate:trust   (нужен SUPABASE_DB_URL в .env.local)",
        "  2) SQL Editor → apps/web/supabase/BUNDLE_TRUST_ONLY.sql → Run",
        "  3) npm run db:project — проверить ref и Dashboard URL",
        "После миграций: node scripts/backfill-reputation.mjs",
      ].join("\n"),
    );
    process.exit(1);
  }

  console.log("✅ Trust staging smoke OK");
  console.log(`   Supabase: ${url}`);
  console.log(`   Dashboard: ${dashboardUrl}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
