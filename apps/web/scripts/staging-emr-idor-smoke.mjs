#!/usr/bin/env node
/**
 * Read-only EMR IDOR smoke for staging (or local with real Supabase).
 *
 * Requires:
 *   STAGING_APP_URL (e.g. https://your-preview.vercel.app or http://localhost:3000)
 *   IDOR_USER_A_EMAIL / IDOR_USER_A_PASSWORD — creates or owns patient A
 *   IDOR_USER_B_EMAIL / IDOR_USER_B_PASSWORD — must NOT see patient A
 *
 * Optional: IDOR_PATIENT_A_ID — skip create, use existing uuid owned by user A
 *
 * No secrets printed. Production only with explicit STAGING_APP_URL (not prod URL unless you intend).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const envFile = path.join(__dirname, "..", ".env.staging-idor");
const env = { ...loadEnv(envFile), ...process.env };

const baseUrl = (env.STAGING_APP_URL ?? "").replace(/\/$/, "");
const emailA = env.IDOR_USER_A_EMAIL;
const passwordA = env.IDOR_USER_A_PASSWORD;
const emailB = env.IDOR_USER_B_EMAIL;
const passwordB = env.IDOR_USER_B_PASSWORD;
let patientAId = env.IDOR_PATIENT_A_ID;

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function signIn(email, password) {
  const res = await fetch(`${baseUrl}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (!res.ok) fail(`sign-in failed for ${email}: HTTP ${res.status}`);
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function apiGet(cookie, pathname) {
  return fetch(`${baseUrl}${pathname}`, {
    headers: cookie ? { Cookie: cookie } : {},
  });
}

async function main() {
  if (!baseUrl) fail("Set STAGING_APP_URL in .env.staging-idor or env");
  if (!emailA || !passwordA || !emailB || !passwordB) {
    fail("Set IDOR_USER_A_* and IDOR_USER_B_* credentials (synthetic test accounts)");
  }

  console.log(`\n🔍 EMR IDOR smoke · ${baseUrl}\n`);

  const cookieA = await signIn(emailA, passwordA);
  const cookieB = await signIn(emailB, passwordB);

  if (!patientAId) {
    const createRes = await fetch(`${baseUrl}/api/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        display_label: "IDOR stub label",
        meta: { notes: "synthetic idor test" },
      }),
    });
    if (!createRes.ok) {
      fail(`user A could not create patient: HTTP ${createRes.status}`);
    }
    const body = await createRes.json();
    patientAId = body.patient?.id;
    if (!patientAId) fail("create patient returned no id");
    console.log("✅ User A created synthetic patient");
  }

  const own = await apiGet(cookieA, `/api/patients/${patientAId}`);
  if (own.status !== 200) fail(`user A cannot read own patient: HTTP ${own.status}`);
  console.log("✅ User A reads own patient");

  const cross = await apiGet(cookieB, `/api/patients/${patientAId}`);
  if (cross.status !== 404) {
    fail(`IDOR: user B got HTTP ${cross.status} for user A patient (expected 404)`);
  }
  console.log("✅ User B blocked from user A patient (404)");

  const studies = await apiGet(cookieB, `/api/patients/${patientAId}/studies`);
  if (studies.status !== 404) {
    fail(`IDOR studies: user B got HTTP ${studies.status} (expected 404)`);
  }
  console.log("✅ User B blocked from studies under A patient");

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
