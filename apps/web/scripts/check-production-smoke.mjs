#!/usr/bin/env node
/**
 * Production smoke: health, home HTML, evidence ask (open access).
 * Usage: node scripts/check-production-smoke.mjs [https://sonogyn-pro.ru]
 */
const base = (process.argv[2] ?? "https://sonogyn-pro.ru").replace(/\/$/, "");
const browserUa =
  "Mozilla/5.0 (compatible; SonogynProductionCheck/1.0; +https://sonogyn-pro.ru)";

async function main() {
  console.log(`\n🩺 Production smoke · ${base}\n`);

  const health = await fetch(`${base}/api/health`, {
    headers: { "User-Agent": browserUa },
    signal: AbortSignal.timeout(15_000),
  });
  const healthJson = await health.json().catch(() => ({}));
  console.log(health.ok ? "✅" : "❌", `/api/health → ${health.status}`, healthJson.commit ?? "");

  const home = await fetch(`${base}/home`, {
    headers: { "User-Agent": browserUa, Accept: "text/html", "Cache-Control": "no-cache" },
    signal: AbortSignal.timeout(45_000),
  });
  const homeHtml = await home.text();
  const proxy = home.headers.get("x-sonogyn-cd-proxy");
  const complete = homeHtml.includes("</html>");
  console.log(
    home.ok && complete ? "✅" : "❌",
    `/home → ${home.status}, ${homeHtml.length} B, proxy=${proxy ?? "no"}, complete=${complete}`,
  );

  const ask = await fetch(`${base}/api/evidence/assistant/ask`, {
    method: "POST",
    headers: { "User-Agent": browserUa, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "O-RADS 3 тактика",
      corpusMode: "rf_kr",
      useLlm: false,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const askJson = await ask.json().catch(() => ({}));
  const okAsk = ask.ok && (askJson.summary?.length ?? 0) > 10;
  console.log(okAsk ? "✅" : "❌", `POST evidence/ask → ${ask.status}`, askJson.error ?? "");

  const failed = !health.ok || !complete || !okAsk;
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
