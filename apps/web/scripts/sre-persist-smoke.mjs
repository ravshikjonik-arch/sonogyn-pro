#!/usr/bin/env node
/**
 * Autonomous SRE persist smoke for adnex / thyroid / obstetric.
 *
 *   node scripts/sre-persist-smoke.mjs
 *   BASE_URL=https://sonogyn-pro.ru node scripts/sre-persist-smoke.mjs
 *   SRE_DOMAINS=thyroid,obstetric node scripts/sre-persist-smoke.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const base = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const ua = "Mozilla/5.0 SonogynSrePersistSmoke/1.0";
const smokeEmail =
  process.env.SRE_SMOKE_EMAIL?.trim().toLowerCase() ||
  `sre-smoke-${Date.now()}@mailinator.com`;

const CASES = {
  adnex: {
    templateSlug: "adnex-orads-v1",
    input: {
      domain: "adnex",
      measurements: { lengthMm: 42, widthMm: 31, heightMm: 27 },
      morphology: { structure: "unilocular", localization: "ovarian", menopause: "pre" },
      classification: { oradsCategory: 2 },
    },
  },
  thyroid: {
    templateSlug: "thyroid-tirads-v1",
    input: {
      domain: "thyroid",
      measurements: { noduleMaxDiameterMm: 18, thyroidVolumeMl: 12 },
      morphology: {
        composition: "solid",
        echogenicity: "hypoechoic",
        shape: "wider_than_tall",
        margin: "smooth",
        echogenicFoci: "none_or_comet_tail",
      },
    },
  },
  obstetric: {
    templateSlug: "obstetric-biometry-v1",
    input: {
      domain: "obstetric",
      biometry: {
        gestationalAgeWeeks: 28,
        gestationalAgeDays: 3,
        bpdMm: 72,
        hcMm: 265,
        acMm: 240,
        flMm: 54,
        efwGrams: 1200,
      },
    },
  },
};

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

function ok(label, detail) {
  console.log(`✅ ${label}${detail ? ` — ${detail}` : ""}`);
}
function fail(label, detail) {
  console.error(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  process.exitCode = 1;
}

async function api(token, pathname, { method = "GET", body } = {}) {
  const headers = {
    "User-Agent": ua,
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${base}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function smokeDomain(token, domain) {
  const cfg = CASES[domain];
  if (!cfg) {
    fail(domain, "unknown domain");
    return null;
  }

  const createdRes = await api(token, "/api/reports", {
    method: "POST",
    body: { templateSlug: cfg.templateSlug, locale: "ru", input: cfg.input },
  });
  if (createdRes.status !== 201 || !createdRes.json?.persistedId) {
    fail(`${domain} create`, `${createdRes.status} ${JSON.stringify(createdRes.json).slice(0, 220)}`);
    return null;
  }
  const reportId = createdRes.json.persistedId;
  ok(`${domain} persist`, reportId);

  const patchRes = await api(token, `/api/reports/${reportId}`, {
    method: "PATCH",
    body: { status: "finalized" },
  });
  if (patchRes.status !== 200 || patchRes.json?.document?.status !== "finalized") {
    fail(`${domain} finalize`, `${patchRes.status} ${JSON.stringify(patchRes.json).slice(0, 220)}`);
    return null;
  }
  ok(`${domain} finalize`, "finalized");

  const getRes = await api(token, `/api/reports/${reportId}`);
  if (getRes.status !== 200 || getRes.json?.document?.id !== reportId) {
    fail(`${domain} GET`, `${getRes.status}`);
    return null;
  }
  ok(`${domain} GET`, `citations=${getRes.json.document?.output?.citations?.length ?? 0}`);
  return reportId;
}

async function main() {
  const env = { ...loadEnv(), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !service || !anon) {
    fail("env", "need NEXT_PUBLIC_SUPABASE_URL + ANON + SERVICE_ROLE in .env.local");
    return;
  }

  const domains = (process.env.SRE_DOMAINS || "adnex,thyroid,obstetric")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: smokeEmail,
    email_confirm: true,
    user_metadata: { smoke: "sre-persist" },
  });
  if (createErr && !String(createErr.message || "").toLowerCase().includes("already")) {
    fail("createUser", createErr.message);
    return;
  }
  ok("smoke user", smokeEmail);

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: smokeEmail,
  });
  if (linkErr || !linkData?.properties?.hashed_token) {
    fail("generateLink", linkErr?.message || "no hashed_token");
    return;
  }

  const anonClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: otpData, error: otpErr } = await anonClient.auth.verifyOtp({
    type: "email",
    token_hash: linkData.properties.hashed_token,
  });
  const token = otpData?.session?.access_token;
  if (otpErr || !token) {
    fail("verifyOtp", otpErr?.message || "no access_token");
    return;
  }
  ok("session", "Bearer JWT ready");

  const { data: templates, error: tplErr } = await admin
    .from("report_templates")
    .select("slug,domain,is_active")
    .eq("is_active", true)
    .order("slug");
  if (tplErr) {
    fail("templates list", tplErr.message);
    return;
  }
  ok(
    "templates in DB",
    (templates || []).map((t) => t.slug).join(", ") || "(none)",
  );

  const ids = {};
  for (const domain of domains) {
    const id = await smokeDomain(token, domain);
    if (id) ids[domain] = id;
  }

  if (process.exitCode) return;
  console.log("\nSRE persist smoke DONE");
  console.log(JSON.stringify({ base, smokeEmail, domains, ids, userId: created?.user?.id }, null, 2));
}

main().catch((err) => {
  fail("fatal", err instanceof Error ? err.message : String(err));
});
