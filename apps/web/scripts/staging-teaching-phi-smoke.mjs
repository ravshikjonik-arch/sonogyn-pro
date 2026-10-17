#!/usr/bin/env node
/**
 * Staging smoke: teaching PHI gate + EMR list auth (checklist §5).
 * Uses .env.staging-idor (user A) + .env.local (service role for publish probe only).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
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

const staging = loadEnv(path.join(webRoot, ".env.staging-idor"));
const local = loadEnv(path.join(webRoot, ".env.local"));
const env = { ...staging, ...process.env };

const baseUrl = (env.STAGING_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const emailA = env.IDOR_USER_A_EMAIL;
const passwordA = env.IDOR_USER_A_PASSWORD;

async function signIn(email, password) {
  const res = await fetch(`${baseUrl}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (!res.ok) fail(`sign-in failed: HTTP ${res.status}`);
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  if (!emailA || !passwordA) fail("Set IDOR_USER_A_* in .env.staging-idor (npm run setup:staging-idor)");

  console.log(`\n🔍 Teaching PHI + EMR auth smoke · ${baseUrl}\n`);

  const unauth = await fetch(`${baseUrl}/api/patients`);
  if (unauth.status === 401) {
    console.log("✅ GET /api/patients without cookie → 401");
  } else if (unauth.status === 200) {
    const body = await unauth.json().catch(() => ({}));
    const list = body.patients;
    if (!Array.isArray(list) || list.length !== 0) {
      fail(`GET /api/patients without cookie: HTTP 200 but exposed ${list?.length ?? "?"} rows`);
    }
    console.log("✅ GET /api/patients without cookie → 200 empty (OPEN_ACCESS_FULL dev)");
  } else {
    fail(`GET /api/patients without cookie: HTTP ${unauth.status} (expected 401 or empty 200 in dev)`);
  }

  const cookieA = await signIn(emailA, passwordA);

  const phiCreate = await fetch(`${baseUrl}/api/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      title: "contact doctor@test.com",
      description: "staging phi probe",
    }),
  });
  if (phiCreate.status !== 400) fail(`POST /api/cases with email in title: HTTP ${phiCreate.status} (expected 400)`);
  const phiBody = await phiCreate.json().catch(() => ({}));
  if (phiBody.code !== "phi_detected") fail("Expected code phi_detected on create");
  console.log("✅ POST /api/cases with PHI in title → 400 phi_detected");

  const createRes = await fetch(`${baseUrl}/api/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      title: "Staging PHI gate draft",
      description: "Synthetic teaching case for publish gate probe.",
      anatomy: "учебный пример",
    }),
  });
  if (createRes.status !== 201 && createRes.status !== 200) {
    fail(`create draft case: HTTP ${createRes.status}`);
  }
  const created = await createRes.json();
  const caseId = created.case?.id ?? created.id ?? created.caseId;
  if (!caseId) fail("create case returned no id");

  const url = local.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = local.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) fail("Need service role in .env.local for publish PHI probe");

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: updErr } = await admin
    .from("cases")
    .update({ title: "Call +7 916 123 45 67", description: "phi probe" })
    .eq("id", caseId);
  if (updErr) fail(`service update case for publish probe: ${updErr.message}`);

  const publishRes = await fetch(`${baseUrl}/api/cases/${caseId}/publish`, {
    method: "POST",
    headers: { Cookie: cookieA },
  });
  if (publishRes.status !== 400) {
    fail(`POST publish with PHI in DB: HTTP ${publishRes.status} (expected 400)`);
  }
  const pubBody = await publishRes.json().catch(() => ({}));
  if (pubBody.code !== "phi_detected") fail("Expected phi_detected on publish");
  console.log("✅ POST /api/cases/{id}/publish with PHI in fields → 400 phi_detected");

  await admin.from("cases").delete().eq("id", caseId);
  console.log("✅ Cleaned up draft case");

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
