#!/usr/bin/env node
/**
 * Smoke: локальный clinical brain + опционально Ollama + Next API.
 * Usage: pnpm brain:check
 * Env: OLLAMA_URL, SONOGYN_BRAIN_URL (default http://localhost:3000)
 */
const ollamaBase = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const webBase = (process.env.SONOGYN_BRAIN_URL || "http://localhost:3000").replace(/\/$/, "");
const brainGet = `${webBase}/api/ai/brain`;
const brainPost = brainGet;

let exit = 0;

async function checkOllama() {
  const url = `${ollamaBase}/api/tags`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const text = await res.text();
    console.log("ollama", url, "HTTP", res.status);
    if (!res.ok) {
      console.log("ollama: not ok (optional for deterministic brain)");
      return false;
    }
    try {
      const j = JSON.parse(text);
      const names = (j.models || [])
        .map((m) => m.name || m.model)
        .filter(Boolean)
        .slice(0, 6);
      console.log("ollama_models", names.join(", ") || "(none — run: ollama pull qwen3:4b)");
    } catch {
      console.log("ollama_body", text.slice(0, 120));
    }
    return true;
  } catch (e) {
    console.log("ollama DOWN (optional):", e instanceof Error ? e.message : e);
    return false;
  }
}

async function checkBrainApi() {
  try {
    const res = await fetch(brainGet, {
      headers: { "User-Agent": "SonoGyn-brain-check" },
      signal: AbortSignal.timeout(8000),
    });
    const j = await res.json().catch(() => ({}));
    console.log("brain GET", brainGet, "HTTP", res.status, "ollama=", j.ollama, "model=", j.model);
    if (!res.ok) {
      exit = 1;
      return;
    }
    const postRes = await fetch(brainPost, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "SonoGyn-brain-check" },
      body: JSON.stringify({ text: "КТР 63", mode: "local" }),
      signal: AbortSignal.timeout(15000),
    });
    const body = await postRes.json().catch(() => ({}));
    console.log("brain POST local", "HTTP", postRes.status, "engine=", body.engine, "intent=", body.intent);
    if (!postRes.ok || !body.reply) {
      console.log("brain POST failed", JSON.stringify(body).slice(0, 200));
      exit = 1;
      return;
    }
    console.log("reply_preview", String(body.reply).replace(/\s+/g, " ").slice(0, 120));
    if (process.env.SONOGYN_BRAIN_EVIDENCE === "1") {
      const evRes = await fetch(brainPost, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "SonoGyn-brain-check" },
        body: JSON.stringify({ text: "миома интрамуральная FIGO", mode: "local", evidence: true }),
        signal: AbortSignal.timeout(120_000),
      });
      const evBody = await evRes.json().catch(() => ({}));
      console.log(
        "brain POST evidence",
        "HTTP",
        evRes.status,
        "tier=",
        evBody.evidence?.tier,
        "citations=",
        evBody.evidence?.citationCount,
      );
      if (!evRes.ok) exit = 1;
    }
  } catch (e) {
    console.log("brain API skip (run pnpm dev:web first?):", e instanceof Error ? e.message : e);
    console.log("\nUI without API: open", `${webBase}/ai/consultants/brain`, "— режим «Локальный мозг»");
  }
}

const ollamaOk = await checkOllama();
await checkBrainApi();

if (!ollamaOk) {
  console.log("\nOllama optional: brew install ollama && ollama serve && ollama pull qwen3:4b");
}
console.log("\nDoc: docs/integrations/local-clinical-brain.md");
process.exitCode = exit;