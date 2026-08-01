#!/usr/bin/env node
/**
 * Phase 1 closeout smoke (public endpoints, browser UA).
 * Usage: BASE_URL=https://sonogyn-pro.ru node apps/web/scripts/phase1-closeout-smoke.mjs
 */
const BASE = (process.env.BASE_URL || "https://sonogyn-pro.ru").replace(/\/$/, "");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: res.status, json, text: text.slice(0, 200) };
}

const checks = [];

function ok(name, pass, detail) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const cases = await get("/api/cases?feedMode=library&limit=5");
ok("GET /api/cases", cases.status === 200, `status=${cases.status}`);
ok("cases payload shape", Array.isArray(cases.json?.cases), typeof cases.json?.cases);

const filtered = await get("/api/cases?orads=3&tags=cystic&feedMode=library&limit=5");
ok("GET /api/cases?orads&tags", filtered.status === 200, `status=${filtered.status}`);

const templates = await get("/api/reports/templates");
ok(
  "GET /api/reports/templates",
  templates.status === 200 || templates.status === 401,
  `status=${templates.status} (401 ok if auth required)`,
);

const failed = checks.filter((c) => !c.pass);
if (failed.length) {
  console.error(`\nFailed: ${failed.length}`);
  process.exit(1);
}
console.log(`\nPhase 1 smoke OK against ${BASE}`);
