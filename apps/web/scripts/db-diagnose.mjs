#!/usr/bin/env node
/**
 * Диагностика: env-проект vs dashboard, hardening, auto-apply.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

const env = loadEnv(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "?";
const hasDbUrl = Boolean(env.SUPABASE_DB_URL || env.DATABASE_URL);
const hasService = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  SonoGyn DB diagnose                                         ║
╚══════════════════════════════════════════════════════════════╝

  Env project ref     : ${ref}
  API reachable keys  : ${hasService ? "service_role ✅" : "service_role ❌"}
  Auto-migrate (pg)   : ${hasDbUrl ? "SUPABASE_DB_URL ✅" : "SUPABASE_DB_URL ❌"}

  ⚠️  Частая ошибка:
  В Supabase Dashboard вы видите проект grnwcbyslttbrqznnunq (пустой, новый).
  Приложение использует ${ref} (51 профилей, 12 кейсов).
  SQL в grnwcbyslttbrqznnunq НЕ попадает в приложение.

`);

if (!hasService) {
  console.log("Добавьте SUPABASE_SERVICE_ROLE_KEY в .env.local\n");
  process.exit(1);
}

const supabase = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const checks = [
  ["case_lifecycle_events.request_id", () =>
    supabase.from("case_lifecycle_events").select("request_id").limit(1)],
  ["clinical_platform_audit_events", () =>
    supabase.from("clinical_platform_audit_events").select("id").limit(1)],
  ["protocol_structured_drafts.lifecycle_status", () =>
    supabase.from("protocol_structured_drafts").select("lifecycle_status").limit(1)],
];

console.log("Hardening на remote (из .env.local):\n");
let missing = 0;
for (const [label, fn] of checks) {
  const { error } = await fn();
  if (error) {
    console.log(`  ❌ ${label}`);
    missing++;
  } else {
    console.log(`  ✅ ${label}`);
  }
}

console.log("");
if (missing === 0) {
  console.log("✅ Всё применено. npm run dev:web и smoke lifecycle.\n");
  process.exit(0);
}

console.log(`❌ Не хватает ${missing} объект(ов) на ${ref}.\n`);

if (hasDbUrl) {
  console.log("Запустите: npm run db:hardening\n");
} else {
  console.log(`Вариант A — SQL Editor (нужен доступ к dashboard ${ref}):
  1. npm run db:copy-hardening
  2. https://supabase.com/dashboard/project/${ref}/sql/new
  3. Вставить → Run
  4. npm run db:verify-hardening

Вариант B — auto-apply (env почти не меняется, +1 строка):
  1. Войти в Supabase аккаунт, где есть проект ${ref}
     (или Vercel → sonogyn-pro-web → Supabase integration)
  2. Settings → Database → Connection string (URI, pooler :6543)
  3. В .env.local добавить:
     SUPABASE_DB_URL=postgresql://postgres.${ref}:[PASSWORD]@...
  4. npm run db:hardening
  5. npm run db:verify-hardening

NEXT_PUBLIC_SUPABASE_URL менять НЕ нужно.
`);
}
