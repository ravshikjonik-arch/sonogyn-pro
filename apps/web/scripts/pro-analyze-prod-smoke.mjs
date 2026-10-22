#!/usr/bin/env node
/**
 * PRO smoke: POST /api/ai/analyze on production (JPEG → Fly worker or OpenRouter).
 *
 *   node scripts/pro-analyze-prod-smoke.mjs
 *   BASE_URL=https://sonogyn-pro.ru node scripts/pro-analyze-prod-smoke.mjs
 *   node scripts/pro-analyze-prod-smoke.mjs --keep
 *
 * Requires apps/web/.env.local: SUPABASE_SERVICE_ROLE_KEY
 * Auth: DEV_LOGIN_EMAIL/PASSWORD or magic link for PILOT_FOUNDER_USER_ID (default founder).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const base = (process.env.BASE_URL ?? "https://sonogyn-pro.ru").replace(/\/$/, "");
const keep = process.argv.includes("--keep");
const ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 SonogynProAnalyzeSmoke/1.0";
const BUCKET = "teaching-case-media";
const FOUNDER_ID = process.env.PILOT_FOUNDER_USER_ID?.trim() || "55d7a4c9-3dbb-4627-b0f6-a0a1efe01993";
const MIN_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

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

function collectSetCookies(res) {
  if (typeof res.headers.getSetCookie === "function") return res.headers.getSetCookie();
  const raw = res.headers.get("set-cookie");
  if (!raw) return [];
  return raw.split(/,(?=[^;]+?=)/);
}

function cookieHeaderFromSetCookies(setCookies) {
  return setCookies.map((c) => c.split(";")[0].trim()).filter(Boolean).join("; ");
}

async function signIn(email, password) {
  const res = await fetch(`${base}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": ua },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  const cookies = cookieHeaderFromSetCookies(collectSetCookies(res));
  return { status: res.status, json, cookies };
}

async function establishSessionViaMagicLink(admin, email) {
  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const token = linkData?.properties?.hashed_token;
  if (error || !token) {
    return { ok: false, message: error?.message ?? "generateLink: no hashed_token" };
  }
  const verifyUrl = `${base}/auth/callback?token_hash=${encodeURIComponent(token)}&type=email&next=${encodeURIComponent("/home")}`;
  const res = await fetch(verifyUrl, { redirect: "manual", headers: { "User-Agent": ua } });
  const cookies = cookieHeaderFromSetCookies(collectSetCookies(res));
  if (!cookies) return { ok: false, message: `auth/callback HTTP ${res.status}` };
  return { ok: true, cookies };
}

async function establishSession(email, password, admin) {
  const login = await signIn(email, password);
  if (login.json?.ok && login.cookies) return { ok: true, cookies: login.cookies, via: "password" };
  if (admin) {
    const magic = await establishSessionViaMagicLink(admin, email);
    if (magic.ok) return { ...magic, via: "magiclink" };
  }
  return { ok: false, message: login.json?.error ?? `HTTP ${login.status}` };
}

/** JWT for /api/ai/analyze (Bearer), same pattern as sre-persist-smoke. */
async function establishBearerToken(admin, email, supabaseUrl, anonKey) {
  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  if (error || !tokenHash) {
    return { ok: false, message: error?.message ?? "generateLink failed" };
  }
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: otpData, error: otpErr } = await anonClient.auth.verifyOtp({
    type: "email",
    token_hash: tokenHash,
  });
  const accessToken = otpData?.session?.access_token;
  if (otpErr || !accessToken) {
    return { ok: false, message: otpErr?.message ?? "verifyOtp failed" };
  }
  return { ok: true, accessToken };
}

async function findUserIdByEmail(admin, targetEmail) {
  const target = targetEmail.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let failed = 0;
function ok(msg) {
  console.log(`✅ ${msg}`);
}
function fail(msg, detail) {
  console.log(`❌ ${msg}${detail ? ` — ${detail}` : ""}`);
  failed += 1;
}

async function cleanup(admin, { caseId, storagePath, jobId }) {
  if (jobId) await admin.from("ai_analyses").delete().eq("id", jobId);
  if (caseId) {
    await admin.from("case_media").delete().eq("case_id", caseId);
    await admin.from("cases").delete().eq("id", caseId);
  }
  if (storagePath) {
    await admin.storage.from(BUCKET).remove([storagePath]);
  }
}

async function main() {
  console.log(`\n🧠 PRO analyze prod smoke · ${base}\n`);

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  let email = env.DEV_LOGIN_EMAIL?.trim();
  const password = env.DEV_LOGIN_PASSWORD;

  if (!url || !serviceKey || !anonKey) {
    fail("env", "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId = FOUNDER_ID;
  if (email) {
    userId = (await findUserIdByEmail(admin, email)) ?? FOUNDER_ID;
    ok(`User id ${userId.slice(0, 8)}…`);
  } else {
    const { data: founderAuth, error: founderErr } = await admin.auth.admin.getUserById(FOUNDER_ID);
    if (founderErr || !founderAuth.user?.email) {
      fail("Founder auth", founderErr?.message ?? "no email — задайте DEV_LOGIN_EMAIL");
      process.exit(1);
    }
    email = founderAuth.user.email;
    userId = founderAuth.user.id;
    ok(`Founder session ${userId.slice(0, 8)}…`);
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_tier, trial_ends_at")
    .eq("id", userId)
    .maybeSingle();

  const tier = profile?.subscription_tier ?? "?";
  const prevTrial = profile?.trial_ends_at ?? null;
  ok(`Profile tier=${tier}`);

  let restoredTrial = false;
  const trialValid =
    prevTrial && Number.isFinite(new Date(prevTrial).getTime()) && new Date(prevTrial).getTime() > Date.now();
  if (tier !== "pro" && !trialValid) {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: trialErr } = await admin
      .from("profiles")
      .update({ trial_ends_at: until })
      .eq("id", userId);
    if (trialErr) fail("PRO trial bump", trialErr.message);
    else {
      ok("Temporary PRO trial (24h) for smoke");
      restoredTrial = true;
    }
  }

  const bearer = await establishBearerToken(admin, email, url, anonKey);
  if (!bearer.ok) {
    fail("Bearer session", bearer.message);
    process.exit(1);
  }
  ok("Bearer JWT (verifyOtp)");
  const authHeaders = {
    Authorization: `Bearer ${bearer.accessToken}`,
    "User-Agent": ua,
  };

  const stamp = new Date().toISOString().slice(0, 19);
  const { data: caseRow, error: caseErr } = await admin
    .from("cases")
    .insert({
      user_id: userId,
      title: `PRO smoke · ${stamp}`,
      description: "Автотест PRO analyze — учебный, без PHI.",
      anatomy: "Adnexa",
      pathology: "Smoke cyst",
      difficulty: "intermediate",
      status: "draft",
      is_public: false,
      lifecycle_status: "open",
    })
    .select("id")
    .single();

  if (caseErr || !caseRow?.id) {
    fail("Create case", caseErr?.message);
    process.exit(1);
  }
  const caseId = caseRow.id;
  ok(`Case ${caseId.slice(0, 8)}…`);

  const storagePath = `${userId}/${caseId}/${Date.now()}-pro-smoke.png`;
  const { error: upErr } = await admin.storage.from(BUCKET).upload(storagePath, MIN_PNG, {
    contentType: "image/png",
    upsert: false,
  });
  if (upErr) {
    fail("Storage upload", upErr.message);
    await admin.from("cases").delete().eq("id", caseId);
    process.exit(1);
  }
  ok("PNG uploaded");

  const { data: mediaRow, error: mediaErr } = await admin
    .from("case_media")
    .insert({
      case_id: caseId,
      storage_path: storagePath,
      media_type: "image",
      anonymization_status: "passed",
      anonymization_checked_at: new Date().toISOString(),
      anonymization_checked_by: userId,
    })
    .select("id")
    .single();

  if (mediaErr || !mediaRow?.id) {
    fail("case_media", mediaErr?.message);
    await cleanup(admin, { caseId, storagePath });
    process.exit(1);
  }
  const mediaId = mediaRow.id;
  ok(`Media ${mediaId.slice(0, 8)}…`);

  let jobId = null;
  try {
    const analyzeRes = await fetch(`${base}/api/ai/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ caseId, mediaIds: [mediaId] }),
      signal: AbortSignal.timeout(60_000),
    });
    const analyzeJson = await analyzeRes.json().catch(() => ({}));

    if (analyzeRes.status === 402) {
      fail("POST /api/ai/analyze", "402 PRO required — включите PRO/trial для DEV_LOGIN");
      process.exit(1);
    }
    if (analyzeRes.status !== 202 || !analyzeJson.jobId) {
      fail("POST /api/ai/analyze", `${analyzeRes.status} ${analyzeJson.error ?? JSON.stringify(analyzeJson).slice(0, 120)}`);
      process.exit(1);
    }
    jobId = analyzeJson.jobId;
    ok(`Analyze queued jobId=${jobId.slice(0, 8)}…`);

    const deadline = Date.now() + 300_000;
    let lastStatus = "pending";
    while (Date.now() < deadline) {
      await sleep(analyzeJson.pollAfterMs ?? 3000);
      const pollRes = await fetch(`${base}/api/ai/analyze/${jobId}`, {
        headers: authHeaders,
        signal: AbortSignal.timeout(120_000),
      });
      const pollJson = await pollRes.json().catch(() => ({}));
      const row = pollJson.analysis ?? pollJson;
      lastStatus = row.status ?? "?";
      if (!pollRes.ok && pollRes.status !== 404) {
        fail("Poll job", `HTTP ${pollRes.status} ${pollJson.error ?? ""}`);
        break;
      }
      if (lastStatus === "completed") {
        const results = row.results ?? {};
        const pipeline = results.pipeline ?? results.modelVersion ?? "";
        ok(`Job completed pipeline=${pipeline || "n/a"}`);
        if (String(pipeline).includes("us-ai-worker")) {
          ok("Worker path used");
        } else {
          ok("Vision completed (OpenRouter fallback acceptable for 1px PNG)");
        }
        break;
      }
      if (lastStatus === "failed") {
        fail("Job failed", row.error_message ?? pollJson.error ?? "unknown");
        break;
      }
    }
    if (lastStatus !== "completed" && lastStatus !== "failed") {
      fail("Job timeout", `last status=${lastStatus}`);
    }
  } catch (e) {
    fail("Smoke error", e instanceof Error ? e.message : String(e));
  }

  if (restoredTrial) {
    await admin.from("profiles").update({ trial_ends_at: prevTrial }).eq("id", userId);
    ok("Restored trial_ends_at");
  }
  if (!keep) {
    await cleanup(admin, { caseId, storagePath, jobId });
    ok("Cleanup (case + media + job)");
  } else {
    console.log(`\n📌 --keep: /cases/${caseId} job=${jobId}\n`);
  }

  console.log(failed ? `\n${failed} failed\n` : "\nAll PRO analyze checks passed\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
