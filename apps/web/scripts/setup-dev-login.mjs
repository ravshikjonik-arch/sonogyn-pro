#!/usr/bin/env node
/**
 * Один раз создаёт/обновляет dev-аккаунт в Supabase и проверяет вход.
 *
 * 1. Supabase Dashboard → Project ocqlsqqloqvlzutbgrnp → Settings → API → service_role
 * 2. В apps/web/.env.local: SUPABASE_SERVICE_ROLE_KEY=eyJ...
 * 3. npm run setup:dev-login  (из apps/web)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const envPath = path.join(webRoot, ".env.local");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim().replace(/^#\s*/, "");
    if (line.trimStart().startsWith("#")) continue;
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = { ...loadEnv(envPath), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const email = env.DEV_LOGIN_EMAIL?.trim();
const password = env.DEV_LOGIN_PASSWORD;
const full_name = env.DEV_LOGIN_FULL_NAME?.trim();
const birth_year = Number.parseInt(env.DEV_LOGIN_BIRTH_YEAR ?? "", 10);
const specialization = env.DEV_LOGIN_SPECIALIZATION?.trim() || "Акушер-гинеколог";
const institution = env.DEV_LOGIN_INSTITUTION?.trim() || "";

const projectRef = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "ocqlsqqloqvlzutbgrnp";

if (!serviceKey) {
  const raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const commented = /#\s*SUPABASE_SERVICE_ROLE_KEY=/.test(raw);
  console.error(`
❌ Нет SUPABASE_SERVICE_ROLE_KEY в apps/web/.env.local
${commented ? "\n⚠️  Строка есть, но закомментирована (# в начале). Уберите # и вставьте ключ после =\n" : ""}
Сделайте так:
1. Откройте https://supabase.com/dashboard/project/${projectRef}/settings/api
2. Прокрутите до **Project API keys** → **service_role** → Reveal → Copy
3. В apps/web/.env.local (без #):
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
4. Снова: npm run setup:dev-login
`);
  process.exit(1);
}

if (!url || !anon || !email || !password || !full_name || !Number.isFinite(birth_year)) {
  console.error("❌ Проверьте .env.local: NEXT_PUBLIC_SUPABASE_*, DEV_LOGIN_* (включая DEV_LOGIN_BIRTH_YEAR)");
  process.exit(1);
}

const metadata = { full_name, specialization, birth_year, ...(institution ? { institution } : {}) };

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(targetEmail) {
  const target = targetEmail.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  console.log(`→ Аккаунт: ${email}`);
  let userId = await findUserIdByEmail(email);

  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    console.log("✓ Пользователь обновлён (пароль, confirm, профиль)");
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    userId = data.user?.id ?? null;
    console.log("✓ Пользователь создан");
  }

  if (!userId) throw new Error("Не удалось получить user id");

  const nowIso = new Date().toISOString();
  const row = {
    full_name,
    specialization,
    institution: institution || null,
    birth_year,
    updated_at: nowIso,
  };
  await admin.from("profiles").update(row).eq("id", userId);
  await admin.from("users").upsert({ id: userId, email, ...row }, { onConflict: "id" });
  console.log("✓ profiles + users синхронизированы");

  const pub = createClient(url, anon, { auth: { persistSession: false } });
  const { data: signIn, error: signErr } = await pub.auth.signInWithPassword({ email, password });
  if (signErr || !signIn.session) {
    throw new Error(signErr?.message ?? "Вход после setup не удался");
  }
  console.log("✓ Тест входа: OK");
  console.log(`
Готово. Перезапустите dev-сервер и откройте http://localhost:3000
Автовход: DEV_AUTO_LOGIN=true → сразу /app
`);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  if (/birth_year|column/i.test(String(e))) {
    console.error("\nПодсказка: выполните миграцию birth_year в SQL Editor:");
    console.error("  npm run db:migrate -- --bundle-only");
    console.error("  → supabase/BUNDLE_FOR_SQL_EDITOR.sql в Dashboard");
  }
  process.exit(1);
});
