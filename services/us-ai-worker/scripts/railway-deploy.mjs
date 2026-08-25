#!/usr/bin/env node
/**
 * One-shot Railway deploy for us-ai-worker (CLI path — no GitHub UI required).
 *
 * Prerequisite (once): npx @railway/cli@4.5.4 login
 *
 * Usage:
 *   node scripts/railway-deploy.mjs
 *   node scripts/railway-deploy.mjs --skip-up   # only vars + domain
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerRoot = path.join(__dirname, "..");
const webEnvPath = path.join(workerRoot, "../../apps/web/.env.local");
const skipUp = process.argv.includes("--skip-up");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = val;
  }
  return out;
}

function runRailway(args, opts = {}) {
  const result = spawnSync("npx", ["@railway/cli@latest", ...args], {
    cwd: workerRoot,
    encoding: "utf8",
    stdio: opts.inherit ? "inherit" : "pipe",
    env: process.env,
  });
  if (result.status !== 0) {
    const err = result.stderr || result.stdout || `railway ${args.join(" ")} failed`;
    throw new Error(err.trim());
  }
  return (result.stdout ?? "").trim();
}

const env = loadEnv(webEnvPath);
const secret = env.US_AI_WORKER_SECRET?.trim();
const openrouter = env.OPENROUTER_API_KEY?.trim();
const visionModel = env.OPENROUTER_US_VISION_MODEL?.trim() || "openai/gpt-4o-mini";

console.log("\n🚂 SonoGyn us-ai-worker → Railway CLI deploy\n");

try {
  runRailway(["whoami"]);
} catch {
  console.error("✗ Не залогинен в Railway.");
  console.error("  Выполните в Terminal (откроется браузер — войдите GitHub):");
  console.error("  npx @railway/cli@4.5.4 login\n");
  process.exit(1);
}

if (!secret) {
  console.error("✗ US_AI_WORKER_SECRET не найден в apps/web/.env.local");
  process.exit(1);
}

if (!openrouter) {
  console.warn("⚠ OPENROUTER_API_KEY не найден — worker без LLM vision (SonoNet only)");
}

// Link or init project
let linked = false;
try {
  const st = runRailway(["status"]);
  linked = /Project:/i.test(st);
} catch {
  linked = false;
}

if (!linked) {
  console.log("→ railway init (новый проект sonogyn-us-ai)…");
  runRailway(["init", "--name", "sonogyn-us-ai"], { inherit: true });
}

const varPairs = [
  `US_AI_WORKER_SECRET=${secret}`,
  `US_VISION_MODEL=${visionModel}`,
  "US_VISION_BACKEND=openrouter",
  "US_AI_WORKER_REFERER=https://sonogyn-pro.ru",
];
if (openrouter) varPairs.push(`OPENROUTER_API_KEY=${openrouter}`);

console.log("→ railway variables set …");
for (const pair of varPairs) {
  runRailway(["variables", "--set", pair], { inherit: true });
}

if (!skipUp) {
  console.log("→ railway up (Docker build ~10–20 min, INSTALL_USTRI=0 via Dockerfile ARG)…");
  runRailway(["up", "--detach"], { inherit: true });
}

console.log("→ railway domain …");
let domainOut = "";
try {
  domainOut = runRailway(["domain", "--json"]);
} catch {
  domainOut = runRailway(["domain"]);
}

let publicUrl = "";
try {
  const parsed = JSON.parse(domainOut);
  publicUrl = parsed.domain ?? parsed.url ?? "";
} catch {
  const match = domainOut.match(/https:\/\/[^\s]+/);
  publicUrl = match?.[0] ?? domainOut;
}

publicUrl = publicUrl.replace(/\/$/, "");

if (publicUrl) {
  console.log(`\n✓ Public URL: ${publicUrl}`);
  console.log(`\nДобавьте в apps/web/.env.local:\n  US_AI_WORKER_URL=${publicUrl}`);
  console.log(`\nSmoke:\n  curl -s ${publicUrl}/health | python3 -m json.tool\n`);
} else {
  console.log("\n→ Domain: откройте Railway → Networking → Generate Domain\n");
}

console.log("Дальше: cd apps/web && node scripts/sync-vercel-env.mjs && Redeploy Vercel\n");
