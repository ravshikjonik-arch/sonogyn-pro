#!/usr/bin/env node
/**
 * Smoke: doctor chat v2 gates (auth, flag, PHI on send) + media upload auth.
 * Env: .env.local — BASE_URL or STAGING_APP_URL, optional IDOR_USER_A_* for authenticated probes.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const local = loadEnv(path.join(webRoot, ".env.local"));
const staging = loadEnv(path.join(webRoot, ".env.staging-idor"));
const env = { ...local, ...staging, ...process.env };

const baseUrl = (
  process.argv[2] ||
  env.BASE_URL ||
  env.STAGING_APP_URL ||
  env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const email = env.IDOR_USER_A_EMAIL;
const password = env.IDOR_USER_A_PASSWORD;
const v2Enabled =
  env.DOCTOR_CHAT_V2_ENABLED === "true" || env.DOCTOR_CHAT_V2_ENABLED === "1";

async function signIn() {
  const res = await fetch(`${baseUrl}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (!res.ok) return null;
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  console.log(`\n🔍 Messenger chat v2 smoke · ${baseUrl}\n`);

  const healthRes = await fetch(`${baseUrl}/api/health`);
  if (!healthRes.ok) fail(`GET /api/health → HTTP ${healthRes.status}`);
  const healthJson = await healthRes.json().catch(() => ({}));
  if (typeof healthJson.rollout?.doctorChatV2 !== "boolean") {
    fail("GET /api/health missing rollout.doctorChatV2");
  }
  console.log(`✅ GET /api/health rollout.doctorChatV2=${healthJson.rollout.doctorChatV2}`);

  const casesPage = await fetch(`${baseUrl}/cases?tab=chat`, { redirect: "manual" });
  if (casesPage.status >= 500) fail(`GET /cases?tab=chat → HTTP ${casesPage.status}`);
  console.log(`✅ GET /cases?tab=chat → HTTP ${casesPage.status}`);

  const mediaUnauth = await fetch(`${baseUrl}/api/doctor-chat/media`, { method: "POST" });
  if (mediaUnauth.status !== 401) {
    fail(`POST /api/doctor-chat/media unauth → HTTP ${mediaUnauth.status} (expected 401)`);
  }
  console.log("✅ POST /api/doctor-chat/media unauth → 401");

  const messengerUnauth = await fetch(
    `${baseUrl}/api/messenger/messages?chatId=00000000-0000-4000-8000-000000000001&limit=1`,
  );
  if (!v2Enabled && messengerUnauth.status !== 404) {
    fail(`GET messenger (v2 off) → HTTP ${messengerUnauth.status} (expected 404)`);
  }
  if (v2Enabled && messengerUnauth.status !== 401) {
    fail(`GET messenger (v2 on) unauth → HTTP ${messengerUnauth.status} (expected 401)`);
  }
  console.log(
    v2Enabled
      ? "✅ GET /api/messenger/messages unauth → 401 (v2 enabled)"
      : "✅ GET /api/messenger/messages → 404 (v2 disabled)",
  );

  const reportUnauth = await fetch(`${baseUrl}/api/messenger/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (v2Enabled && reportUnauth.status !== 401) {
    fail(`POST messenger/reports unauth → HTTP ${reportUnauth.status} (expected 401)`);
  }
  if (!v2Enabled && reportUnauth.status !== 404) {
    fail(`POST messenger/reports (v2 off) → HTTP ${reportUnauth.status} (expected 404)`);
  }
  console.log(
    v2Enabled
      ? "✅ POST /api/messenger/reports unauth → 401"
      : "✅ POST /api/messenger/reports → 404 (v2 disabled)",
  );

  if (!email || !password) {
    console.log("⏭️  Skip auth probes — set IDOR_USER_A_* in .env.staging-idor");
    console.log("\n✅ Messenger chat v2 smoke (partial) OK\n");
    return;
  }

  const cookie = await signIn();
  if (!cookie) fail("sign-in failed");

  const phiBody = {
    chatId: "00000000-0000-4000-8000-000000000001",
    clientUuid: "00000000-0000-4000-8000-000000000099",
    body: "Пациентка: Иванова Мария Петровна, тел +7 916 123-45-67",
  };
  const phiRes = await fetch(`${baseUrl}/api/messenger/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(phiBody),
  });
  if (v2Enabled) {
    if (phiRes.status !== 400) {
      const t = await phiRes.text();
      fail(`POST messenger PHI → HTTP ${phiRes.status} (expected 400): ${t.slice(0, 120)}`);
    }
    const phiJson = await phiRes.json();
    if (phiJson.code !== "phi_detected") fail("POST messenger PHI missing code phi_detected");
    console.log("✅ POST /api/messenger/messages PHI body → 400 phi_detected");
  } else {
    console.log("⏭️  PHI POST probe skipped (v2 disabled)");
  }

  const v1Phi = await fetch(`${baseUrl}/api/doctor-chat/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      channelId: "00000000-0000-4000-8000-000000000001",
      body: "Пациентка: Иванова Мария Петровна, тел +7 916 123-45-67",
    }),
  });
  if (v1Phi.status !== 400) {
    fail(`POST doctor-chat/messages PHI → HTTP ${v1Phi.status} (expected 400)`);
  }
  console.log("✅ POST /api/doctor-chat/messages PHI body → 400 phi_detected");

  console.log("\n✅ Messenger chat v2 smoke OK\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
