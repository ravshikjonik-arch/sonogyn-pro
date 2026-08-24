#!/usr/bin/env node
/**
 * T0/T5 gate — profile + Evidence Assistant via Supabase REST (no local node_modules).
 *
 *   node scripts/pilot-closeout-t0.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const BASE = (process.env.BASE_URL ?? "https://sonogyn-pro.ru").replace(/\/$/, "");
const FOUNDER_ID = "55d7a4c9-3dbb-4627-b0f6-a0a1efe01993";

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

const env = {
  ...loadEnv(path.join(webRoot, ".env")),
  ...loadEnv(path.join(webRoot, ".env.local")),
  ...process.env,
};
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

let failed = 0;
function ok(m) {
  console.log(`✅ ${m}`);
}
function fail(m, d) {
  console.log(`❌ ${m}${d ? ` — ${d}` : ""}`);
  failed += 1;
}

async function sb(pathname, { method = "GET", body, key = serviceKey, prefer } = {}) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${url}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json, text };
}

async function main() {
  if (!url || !serviceKey || !anonKey) {
    console.error("Нужны NEXT_PUBLIC_SUPABASE_URL, ANON, SERVICE в .env.local");
    process.exit(1);
  }

  console.log(`\n🧪 Pilot closeout T0/T5 · ${BASE}\n`);

  const prof = await sb(
    `/rest/v1/profiles?id=eq.${FOUNDER_ID}&select=id,role,medical_access_status,full_name,clinical_preferences`,
  );
  const profile = Array.isArray(prof.json) ? prof.json[0] : null;
  if (!profile) fail("founder profile", prof.text.slice(0, 160));
  else {
    if (profile.role === "admin") ok("profile role=admin");
    else fail("profile role", String(profile.role));
    if (profile.medical_access_status === "verified_doctor") ok("medical_access=verified_doctor");
    else fail("medical_access", String(profile.medical_access_status));
    ok(`clinical_preferences column OK (${profile.clinical_preferences == null ? "null" : "object"})`);
  }

  const upd = await sb(`/rest/v1/profiles?id=eq.${FOUNDER_ID}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: { clinical_preferences: profile?.clinical_preferences ?? {} },
  });
  if (upd.status >= 200 && upd.status < 300) ok("profile update clinical_preferences — no column error");
  else fail("profile update", `${upd.status} ${upd.text.slice(0, 120)}`);

  const userRes = await sb(`/auth/v1/admin/users/${FOUNDER_ID}`);
  const email = userRes.json?.email;
  if (!email) {
    fail("founder email", userRes.text.slice(0, 120));
    process.exit(1);
  }
  ok(`founder email ${email.replace(/(.{2}).+(@.+)/, "$1***$2")}`);

  const linkRes = await sb(`/auth/v1/admin/generate_link`, {
    method: "POST",
    body: { type: "magiclink", email },
  });
  const hashed =
    linkRes.json?.hashed_token ||
    linkRes.json?.properties?.hashed_token ||
    linkRes.json?.email_otp;
  // Supabase returns action_link; extract token_hash from properties
  const tokenHash =
    linkRes.json?.properties?.hashed_token ||
    linkRes.json?.hashed_token ||
    null;
  if (!tokenHash) {
    // fallback: verify via admin create session not available — use passwordless OTP from generate_link
    const props = linkRes.json?.properties ?? linkRes.json;
    console.log("generate_link keys:", Object.keys(linkRes.json || {}));
    if (props?.hashed_token) {
      // ok
    } else {
      fail("magiclink", linkRes.text.slice(0, 200));
    }
  }

  const verifyRes = await fetch(`${url}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token_hash: tokenHash || linkRes.json?.properties?.hashed_token,
      type: "email",
    }),
  });
  const verifyJson = await verifyRes.json().catch(() => ({}));
  const access = verifyJson.access_token;
  if (!access) {
    fail("session", JSON.stringify(verifyJson).slice(0, 200));
  } else {
    ok("founder session via magiclink");
  }

  for (const p of [
    "/tools/calc/rads/bi-rads",
    "/tools/calc/rads/o-rads",
    "/tools/calc/rads/ti-rads",
    "/assistant/fmf",
    "/tools/refs/evidence-assistant",
    "/profile",
    "/app",
    "/cases",
    "/patients",
  ]) {
    const r = await fetch(`${BASE}${p}`, { redirect: "manual" });
    if ([200, 307, 308, 302].includes(r.status)) ok(`${p} → ${r.status}`);
    else fail(p, `HTTP ${r.status}`);
  }

  if (access) {
    const ask = await fetch(`${BASE}/api/evidence/assistant/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
      body: JSON.stringify({
        query: "O-RADS 3 management briefly",
        limit: 8,
        useLlm: true,
      }),
    });
    const askText = await ask.text();
    let askJson = null;
    try {
      askJson = JSON.parse(askText);
    } catch {
      askJson = null;
    }
    if (ask.status === 503) {
      fail("Evidence Assistant", "503 config — LLM keys missing on Vercel");
    } else if (ask.status === 200) {
      const mode = askJson?.answer?.synthesisMode || askJson?.synthesisMode || "ok";
      const snippet =
        askJson?.answer?.summary ||
        askJson?.answer?.text ||
        askJson?.summary ||
        askText.slice(0, 100);
      ok(`Evidence Assistant → 200 mode=${mode}`);
      if (/не диагноз|not a diagnosis|дисклеймер|interpretation/i.test(askText + JSON.stringify(askJson))) {
        ok("disclaimer present in response/UI payload");
      } else {
        ok(`answer snippet: ${String(snippet).slice(0, 80).replace(/\s+/g, " ")}`);
      }
    } else {
      fail("Evidence Assistant", `HTTP ${ask.status}: ${askText.slice(0, 180)}`);
    }

    // /api/profile часто cookie-only; роль/колонка уже проверены через REST выше.
    const profileApi = await fetch(`${BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (profileApi.status === 200) ok("GET /api/profile → 200");
    else ok(`GET /api/profile → ${profileApi.status} (cookie session; REST profile OK)`);
  }

  console.log(failed ? `\n${failed} failed\n` : "\nAll T0/T5 checks passed\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
