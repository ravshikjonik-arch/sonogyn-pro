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

  const worker = await fetch(`${base}/api/ai/worker-status`, {
    headers: { "User-Agent": browserUa, Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  const workerJson = await worker.json().catch(() => ({}));
  const okWorker =
    worker.ok && workerJson.configured === true && workerJson.available === true;
  console.log(
    okWorker ? "✅" : "❌",
    `/api/ai/worker-status → ${worker.status}`,
    okWorker ? "available" : (workerJson.reason ?? workerJson.error ?? ""),
  );

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

  async function fetchEvidenceAsk() {
    const res = await fetch(`${base}/api/evidence/assistant/ask`, {
      method: "POST",
      headers: {
        "User-Agent": browserUa,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: "O-RADS 3 тактика",
        corpusMode: "rf_kr",
        useLlm: false,
      }),
      signal: AbortSignal.timeout(180_000),
    });
    const json = await res.json().catch(() => ({}));
    return { res, json };
  }

  let { res: ask, json: askJson } = await fetchEvidenceAsk();
  let summaryLen = askJson.summary?.length ?? 0;
  if (ask.ok && summaryLen <= 10) {
    ({ res: ask, json: askJson } = await fetchEvidenceAsk());
    summaryLen = askJson.summary?.length ?? 0;
  }
  const okAsk = ask.ok && summaryLen > 10;
  console.log(
    okAsk ? "✅" : "❌",
    `POST evidence/ask → ${ask.status}`,
    okAsk ? `summary ${summaryLen} chars` : (askJson.error ?? `summary ${summaryLen} chars`),
  );

  const fetometry = await fetch(`${base}/tools/calc/ob/fetometry-norms`, {
    headers: { "User-Agent": browserUa, Accept: "text/html", "Cache-Control": "no-cache" },
    signal: AbortSignal.timeout(45_000),
  });
  const fetometryHtml = await fetometry.text();
  const fetometryComplete = fetometryHtml.includes("</html>");
  const fetometryTitle = /Калькулятор норм фетометрии/i.test(fetometryHtml);
  const fetometryRoute = fetometryHtml.includes("fetometry-norms");
  const fetometryHasCatalog =
    /96 таблиц|96 калькуляторов|medvedev-archive|clinical\/medvedev-archive/i.test(fetometryHtml);
  const okFetometry =
    fetometry.ok && fetometryComplete && fetometryTitle && fetometryRoute && fetometryHasCatalog;
  console.log(
    okFetometry ? "✅" : "❌",
    `/tools/calc/ob/fetometry-norms → ${fetometry.status}, ${fetometryHtml.length} B, title=${fetometryTitle}, route=${fetometryRoute}, catalog=${fetometryHasCatalog}`,
  );

  const atlasRoutes = [
    "/tools/refs/nosologies",
    "/tools/refs/cervix-morphology-atlas",
    "/tools/refs/mammology-national-atlas",
    "/tools/refs/prenatal-echography-atlas",
    "/tools/refs/clinical-echocardiography-atlas",
  ];
  let okAtlasHead = true;
  for (const path of atlasRoutes) {
    const r = await fetch(`${base}${path}`, {
      method: "HEAD",
      headers: { "User-Agent": browserUa },
      signal: AbortSignal.timeout(30_000),
    });
    const lineOk = r.ok;
    if (!lineOk) okAtlasHead = false;
    console.log(lineOk ? "✅" : "❌", `HEAD ${path} → ${r.status}`);
  }

  const bookSamplePath = "/tools/refs/book-nosology/book%3Acervix-morpho%3Apredislovie";
  const bookSample = await fetch(`${base}${bookSamplePath}`, {
    method: "HEAD",
    headers: { "User-Agent": browserUa },
    signal: AbortSignal.timeout(30_000),
  });
  const okBookAtlas = bookSample.ok;
  console.log(okBookAtlas ? "✅" : "❌", `HEAD book-nosology sample → ${bookSample.status}`);

  const prenatalImg = await fetch(`${base}/clinical-atlas/prenatal-echo-ru/02-007a.jpg`, {
    method: "HEAD",
    headers: { "User-Agent": browserUa },
    signal: AbortSignal.timeout(30_000),
  });
  const okPrenatalImg = prenatalImg.ok && (prenatalImg.headers.get("content-type") ?? "").includes("image");
  console.log(
    okPrenatalImg ? "✅" : "❌",
    `HEAD prenatal Storage rewrite → ${prenatalImg.status}`,
    prenatalImg.headers.get("content-type") ?? "",
  );

  const failed =
    !health.ok || !okWorker || !complete || !okAsk || !okFetometry || !okAtlasHead || !okBookAtlas || !okPrenatalImg;
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
