#!/usr/bin/env node
/**
 * Smoke-check production readiness (no secrets printed).
 * Usage: node scripts/check-production-ready.mjs [baseUrl]
 */
const base = (process.argv[2] ?? "https://sonogyn-pro.ru").replace(/\/$/, "");

async function fetchJson(path) {
  const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html or empty */
  }
  return { status: res.status, json, ok: res.ok };
}

console.log(`\nProduction check: ${base}\n`);

const pages = ["/", "/login", "/register"];
for (const path of pages) {
  try {
    const { status } = await fetchJson(path);
    const icon = status >= 200 && status < 400 ? "✓" : "✗";
    console.log(`${icon} ${path} → HTTP ${status}`);
  } catch (e) {
    console.log(`✗ ${path} → ${e instanceof Error ? e.message : "error"}`);
  }
}

try {
  const { status, json } = await fetchJson("/api/auth/status");
  if (status !== 200 || !json) {
    console.log(`✗ /api/auth/status → HTTP ${status}`);
  } else {
    console.log(`✓ /api/auth/status → appOrigin=${json.appOrigin}`);
    console.log(`  smsProvider=${json.features?.smsProvider ?? "?"} customSms=${json.features?.customSmsAuth}`);
    console.log(`  yookassa=${json.features?.yookassaConfigured ?? false}`);
    if (Array.isArray(json.issues) && json.issues.length) {
      for (const issue of json.issues.slice(0, 5)) {
        console.log(`  ○ ${issue}`);
      }
    }
  }
} catch (e) {
  console.log(`✗ /api/auth/status → ${e instanceof Error ? e.message : "error"}`);
}

console.log("\nManual (Vercel Dashboard):");
console.log("  SMSRU_API_ID + SMS_PROVIDER=smsru");
console.log("  Supabase SQL: 20260617140000_yookassa_payments.sql");
console.log("  Redeploy after env changes\n");
