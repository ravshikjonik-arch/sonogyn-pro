#!/usr/bin/env node
/**
 * Prod smoke: Fly US AI Worker auth + Vercel worker-status (no LLM spend).
 *
 *   node scripts/us-ai-worker-prod-smoke.mjs
 *   WORKER_URL=https://sonogyn-us-ai.fly.dev node scripts/us-ai-worker-prod-smoke.mjs
 *
 * Secret: US_AI_WORKER_SECRET from env, or apps/web/.env.local (not printed).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const envLocal = path.join(webRoot, ".env.local");
const rotationFile = path.join(webRoot, "..", "..", ".tmp/railway-rotation-2026-10-22.txt");

const WORKER_URL = (process.env.WORKER_URL ?? "https://sonogyn-us-ai.fly.dev").replace(/\/$/, "");
const SITE = (process.env.BASE_URL ?? "https://sonogyn-pro.ru").replace(/\/$/, "");
const UA = "Mozilla/5.0 SonogynUsAiWorkerSmoke/1.0";

function readSecretFromFile(filePath) {
  if (!fs.existsSync(filePath)) return "";
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (t.startsWith("US_AI_WORKER_SECRET=")) {
      return t.slice("US_AI_WORKER_SECRET=".length).trim();
    }
  }
  return "";
}

/** Prod truth: rotation file (Vercel/Fly), then env, then .env.local. */
function loadSecret() {
  return (
    process.env.US_AI_WORKER_SECRET?.trim() ||
    readSecretFromFile(rotationFile) ||
    readSecretFromFile(envLocal) ||
    ""
  );
}

async function main() {
  console.log(`\n🤖 US AI Worker prod smoke\n   worker: ${WORKER_URL}\n   site:   ${SITE}\n`);

  let failed = 0;
  const fail = (msg) => {
    console.log(`❌ ${msg}`);
    failed += 1;
  };
  const ok = (msg) => console.log(`✅ ${msg}`);

  const health = await fetch(`${WORKER_URL}/health`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(20_000),
  });
  const healthJson = await health.json().catch(() => ({}));
  if (!health.ok || healthJson.status !== "ok") {
    fail(`/health → ${health.status}`);
  } else {
    ok(`/health → ok (dicom=${healthJson.capabilities?.dicom}, sononet=${healthJson.capabilities?.sononet})`);
  }

  const siteStatus = await fetch(`${SITE}/api/ai/worker-status`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25_000),
  });
  const siteJson = await siteStatus.json().catch(() => ({}));
  if (!siteStatus.ok || !siteJson.available) {
    fail(`Vercel worker-status → ${siteStatus.status} ${siteJson.reason ?? siteJson.error ?? ""}`);
  } else {
    ok("Vercel worker-status → available");
  }

  const noAuth = await fetch(`${WORKER_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ clinicalContext: "smoke", frames: [] }),
    signal: AbortSignal.timeout(15_000),
  });
  if (noAuth.status !== 401) {
    fail(`POST /analyze without Bearer → ${noAuth.status} (expected 401)`);
  } else {
    ok("POST /analyze without Bearer → 401");
  }

  const secret = loadSecret();
  if (!secret) {
    fail("US_AI_WORKER_SECRET missing (env, .env.local, or .tmp/railway-rotation)");
  } else {
    const bad = await fetch(`${WORKER_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer wrong-secret-smoke",
        "User-Agent": UA,
      },
      body: JSON.stringify({ clinicalContext: "smoke", frames: [] }),
      signal: AbortSignal.timeout(15_000),
    });
    if (bad.status !== 401) {
      fail(`POST /analyze wrong secret → ${bad.status} (expected 401)`);
    } else {
      ok("POST /analyze wrong secret → 401");
    }

    const good = await fetch(`${WORKER_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
        "User-Agent": UA,
      },
      body: JSON.stringify({
        clinicalContext: "smoke auth only — no frames",
        frames: [],
        domain: "gyn",
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const goodJson = await good.json().catch(() => ({}));
    if (good.status === 401) {
      fail("POST /analyze with local secret → 401 (secret mismatch vs Fly/Vercel?)");
    } else if (good.status === 500 && String(goodJson.error ?? "").includes("Нет декодируемых")) {
      ok("POST /analyze auth OK (empty frames → expected worker error, no LLM)");
    } else if (good.ok && goodJson.pipeline) {
      ok(`POST /analyze auth OK (pipeline=${goodJson.pipeline})`);
    } else {
      ok(`POST /analyze auth OK (HTTP ${good.status}, not 401)`);
    }
  }

  console.log(failed ? `\n${failed} check(s) failed\n` : "\nAll worker checks passed\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
