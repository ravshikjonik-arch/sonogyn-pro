#!/usr/bin/env node
/**
 * Самопроверка clinical brain: скорость + корректность intent/движка.
 * Usage: node scripts/brain-assistant-verify.mjs
 * Env: SONOGYN_BRAIN_URL (default http://localhost:3000)
 */
const base = (process.env.SONOGYN_BRAIN_URL || "http://localhost:3000").replace(/\/$/, "");
const API = `${base}/api/ai/brain`;
const UA = "SonoGyn-brain-verify";

const CASES = [
  {
    name: "CRL calculate",
    body: { text: "КТР 63", mode: "local" },
    expectIntent: "calculate",
    expectEngine: "engines",
    maxMs: 3000,
    assert: (j) => j.contract?.disclaimer?.includes("врач"),
  },
  {
    name: "NT+CRL calculate",
    body: { text: "NT 1.8 при КТР 63", mode: "local" },
    expectIntent: "calculate",
    maxMs: 3000,
    assert: (j) => Boolean(j.contract?.result && Object.keys(j.contract.result).length > 0),
  },
  {
    name: "Myoma FIGO multistep",
    body: { text: "миома интрамуральная", mode: "local" },
    expectIntent: "calculate",
    maxMs: 3000,
    assert: (j) =>
      (j.contract?.missingSlotPrompts?.length ?? 0) >= 1 ||
      j.contract?.tool === "uterus_myoma_figo",
  },
  {
    name: "Evidence registry tier",
    body: { text: "КТР 63 миома FIGO", mode: "local", evidence: true },
    expectIntent: "calculate",
    maxMs: 8000,
    assert: (j) => j.evidence?.tier === "registry",
  },
  {
    name: "Evidence full (guideline)",
    body: { text: "порог NT 3.5 тактика скрининг", mode: "local", evidence: true },
    maxMs: 90_000,
    assert: (j) =>
      j.evidence?.tier === "full" || j.reply?.includes("Evidence") || (j.contract?.citations?.length ?? 0) > 1,
  },
];

let failed = 0;
const timings = [];

async function runCase(c) {
  const t0 = performance.now();
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify(c.body),
      signal: AbortSignal.timeout(c.maxMs + 5000),
    });
    const ms = Math.round(performance.now() - t0);
    timings.push({ name: c.name, ms, status: res.status });
    const j = await res.json().catch(() => ({}));
    const ok =
      res.ok &&
      (!c.expectIntent || j.intent === c.expectIntent) &&
      (!c.expectEngine || j.engine === c.expectEngine) &&
      ms <= c.maxMs &&
      (!c.assert || c.assert(j));
    if (!ok) {
      failed += 1;
      console.log("FAIL", c.name, "HTTP", res.status, "ms=", ms, "intent=", j.intent, "engine=", j.engine);
      console.log("  preview:", String(j.reply || j.error || "").replace(/\s+/g, " ").slice(0, 100));
      return;
    }
    const fast = ms < 1500 ? "⚡" : ms < 5000 ? "✓" : "~";
    console.log(`${fast} OK`, c.name, `${ms}ms`, "intent=", j.intent, c.body.evidence ? `evidence=${j.evidence?.tier}` : "");
  } catch (e) {
    failed += 1;
    console.log("FAIL", c.name, e instanceof Error ? e.message : e);
  }
}

console.log("brain verify", API);
const get0 = performance.now();
const getRes = await fetch(API, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
const getJson = await getRes.json().catch(() => ({}));
console.log("GET", getRes.status, `${Math.round(performance.now() - get0)}ms`, "evidenceCapable=", getJson.evidenceCapable);

for (const c of CASES) {
  await runCase(c);
}

const localCases = timings.filter((t) => !t.name.includes("Evidence full"));
const avgLocal =
  localCases.length > 0 ? Math.round(localCases.reduce((a, b) => a + b.ms, 0) / localCases.length) : 0;
console.log("\nСредняя задержка без тяжёлого evidence:", avgLocal, "ms");
console.log(failed ? `\n${failed} FAILED` : "\nAll checks passed");
process.exitCode = failed ? 1 : 0;