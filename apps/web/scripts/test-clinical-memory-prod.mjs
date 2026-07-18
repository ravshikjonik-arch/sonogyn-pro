#!/usr/bin/env node
/**
 * Prod smoke: O-RADS clinical memory APIs (authenticated).
 *
 * Usage:
 *   PILOT_EMAIL=dni1980@rambler.ru PILOT_PASSWORD=... node scripts/test-clinical-memory-prod.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const base = process.env.BASE_URL?.trim() || "https://sonogyn-pro.ru";
const email = process.env.PILOT_EMAIL?.trim().toLowerCase() || "dni1980@rambler.ru";
const password = process.env.PILOT_PASSWORD?.trim();
const ua = "Mozilla/5.0 SonogynClinicalMemoryCheck/1.0";

function loadEnv() {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function parseSetCookie(header) {
  const jar = new Map();
  const parts = header.split(/,(?=\s*[^;]+=[^;]+)/);
  for (const chunk of parts) {
    const [pair] = chunk.split(";");
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
  return jar;
}

function mergeCookies(jar, header) {
  if (!header) return jar;
  const next = new Map(jar);
  for (const [k, v] of parseSetCookie(header)) next.set(k, v);
  return next;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function request(jar, pathname, { method = "GET", body } = {}) {
  const headers = { "User-Agent": ua, Accept: "application/json" };
  const cookie = cookieHeader(jar);
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${base}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });

  const nextJar = mergeCookies(jar, res.headers.get("set-cookie"));
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, jar: nextJar };
}

let failed = 0;
function ok(label, detail) {
  console.log(`✅ ${label}${detail ? ` — ${detail}` : ""}`);
}
function fail(label, detail) {
  console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  failed += 1;
}

if (!password) {
  console.error("❌ Set PILOT_PASSWORD (or run reset-doctor-password.mjs first)");
  process.exit(1);
}

console.log(`\n🧠 Clinical memory prod check · ${base}`);
console.log(`   User: ${email}\n`);

let jar = new Map();

const signIn = await request(jar, "/api/auth/sign-in", {
  method: "POST",
  body: { email, password },
});
jar = signIn.jar;

if (!signIn.json.ok) {
  fail("sign-in", signIn.json.error ?? `HTTP ${signIn.status}`);
  process.exit(1);
}
ok("sign-in", `HTTP ${signIn.status}`);

const getEmpty = await request(jar, "/api/ai/clinical-memory?domain=orads");
jar = getEmpty.jar;
if (getEmpty.status !== 200) fail("GET clinical-memory", `HTTP ${getEmpty.status}`);
else if (getEmpty.json.migrationRequired) fail("GET clinical-memory", "migrationRequired=true");
else ok("GET clinical-memory", `memories=${(getEmpty.json.memories ?? []).length}`);

const stamp = Date.now();
const postBody = {
  domain: "orads",
  memoryType: "doctor_pattern",
  title: `Smoke test ${stamp}`,
  detail: "Автотест: проверка сохранения клинической памяти O-RADS на prod.",
  confidence: "low",
  payload: { smoke: true, stamp },
};

const created = await request(jar, "/api/ai/clinical-memory", {
  method: "POST",
  body: postBody,
});
jar = created.jar;

let memoryId = created.json.memory?.id;
if (created.status !== 200 || !memoryId) {
  fail("POST clinical-memory", created.json.error ?? `HTTP ${created.status}`);
} else {
  ok("POST clinical-memory", `id=${memoryId}`);
}

const getAfter = await request(jar, "/api/ai/clinical-memory?domain=orads");
jar = getAfter.jar;
const found = (getAfter.json.memories ?? []).some((m) => m.id === memoryId);
if (getAfter.status !== 200 || !found) fail("GET after POST", found ? `HTTP ${getAfter.status}` : "memory not listed");
else ok("GET after POST", "memory visible");

const oradsMem = await request(jar, "/api/ai/orads-memory", {
  method: "POST",
  body: {
    extracted: { lesionClass: "cystic", structure: "unilocular", diameterMm: 42 },
    unresolvedNodes: ["vascularity"],
  },
});
jar = oradsMem.jar;
if (oradsMem.status !== 200) fail("POST orads-memory", oradsMem.json.error ?? `HTTP ${oradsMem.status}`);
else ok("POST orads-memory", `insights=${(oradsMem.json.insights ?? []).length}`);

if (memoryId) {
  const del = await request(jar, `/api/ai/clinical-memory?id=${encodeURIComponent(memoryId)}`, {
    method: "DELETE",
  });
  jar = del.jar;
  if (del.status !== 200 || !del.json.ok) fail("DELETE clinical-memory", del.json.error ?? `HTTP ${del.status}`);
  else ok("DELETE clinical-memory", "archived smoke row");
}

console.log(failed ? `\nИтог: ${failed} ошибок\n` : "\nИтог: clinical memory OK ✅\n");
process.exit(failed ? 1 : 0);
