#!/usr/bin/env node
/** Soft check: Colibri OpenAI endpoint + optional local Next gateway status. */
const base = process.env.COLIBRI_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000/v1";
const modelsUrl = base.endsWith("/v1") ? `${base}/models` : `${base}/v1/models`;

let colibriOk = false;
try {
  const res = await fetch(modelsUrl, { signal: AbortSignal.timeout(4000) });
  const text = await res.text();
  console.log("colibri", modelsUrl, "HTTP", res.status);
  if (res.ok) {
    colibriOk = true;
    try {
      const j = JSON.parse(text);
      const data = j.data || [];
      console.log(
        "models",
        data
          .slice(0, 8)
          .map((m) => m.id || m.name)
          .filter(Boolean)
          .join(", ") || "(parsed empty)",
      );
    } catch {
      console.log("body", text.slice(0, 120));
    }
  }
} catch (e) {
  console.log("colibri DOWN:", e instanceof Error ? e.message : e);
}

const gw = process.env.SONOGYN_GATEWAY_STATUS_URL || "http://localhost:3000/api/ai/gateway/status?purpose=evidence";
try {
  const res = await fetch(gw, {
    headers: { "User-Agent": "SonoGyn-colibri-check" },
    signal: AbortSignal.timeout(8000),
  });
  const j = await res.json();
  console.log("gateway", gw, "HTTP", res.status);
  const providers = j.providers || j.chain || j.configured || j;
  console.log("gateway_summary", JSON.stringify(providers).slice(0, 500));
} catch (e) {
  console.log("gateway skip (is next running?):", e instanceof Error ? e.message : e);
}

if (!colibriOk) {
  console.log("\nNext: pnpm colibri:setup   # first time");
  console.log("Then:  pnpm colibri:start && pnpm colibri:wire && restart next");
  process.exitCode = 1;
} else {
  console.log("\nok: Colibri sidecar reachable");
}
