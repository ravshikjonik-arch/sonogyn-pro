/**
 * Проверяет, что в .env.local заданы реальные ключи Supabase (не заглушки).
 * Запуск: из папки apps/web → node scripts/check-supabase-env.js
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Нет файла apps/web/.env.local — скопируйте .env.example и заполните Supabase.");
  process.exit(1);
}

const raw = fs.readFileSync(envPath, "utf8");
const vars = {};
for (const line of raw.split("\n")) {
  if (/^\s*#/.test(line) || !line.trim()) continue;
  const eq = line.indexOf("=");
  if (eq === -1) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  vars[k] = v;
}

const url = vars.NEXT_PUBLIC_SUPABASE_URL || "";
const key = vars.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const badUrl =
  !url ||
  /your-project|YOUR_PROJECT|placeholder|xxxx/i.test(url) ||
  !/^https?:\/\//i.test(url);

const jwtAnonOk = key.startsWith("eyJ") && key.length >= 80;
const publishableOk = key.startsWith("sb_publishable_") && key.length >= 24;

const badKey =
  !key || /your-supabase-anon|YOUR_ANON|placeholder/i.test(key) || (!jwtAnonOk && !publishableOk);

if (badUrl || badKey) {
  console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  Supabase не настроен в apps/web/.env.local                      ║
╠══════════════════════════════════════════════════════════════════╣
║  1) https://supabase.com/dashboard → ваш проект                  ║
║  2) Settings → API                                               ║
║  3) Вставьте без кавычек:                                        ║
║     NEXT_PUBLIC_SUPABASE_URL = Project URL                       ║
║     NEXT_PUBLIC_SUPABASE_ANON_KEY = anon public (JWT eyJ… или sb_publishable_…) ║
║  4) Сохраните файл и перезапустите «npm run dev»                  ║
╚══════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

console.log("Supabase env OK (.env.local)");
process.exit(0);
