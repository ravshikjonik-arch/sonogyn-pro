#!/usr/bin/env node
/**
 * Тест admin-бота Telegram (Phase 0).
 *
 * Usage:
 *   node apps/web/scripts/test-telegram-admin.mjs
 *   node apps/web/scripts/test-telegram-admin.mjs --via-api http://localhost:3000
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const envPath = path.join(webRoot, ".env.local");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function parseAdminIds(raw) {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(/[,;\s]+/).map((id) => id.trim()).filter(Boolean))];
}

function printChatIdHelp() {
  console.log(`
Как получить chat_id:
  1. @BotFather → /newbot → скопируйте TELEGRAM_BOT_TOKEN в apps/web/.env.local
  2. Напишите боту /start в Telegram
  3. Откройте: https://api.telegram.org/bot<TOKEN>/getUpdates
  4. Найдите "chat":{"id":123456789} → TELEGRAM_ADMIN_IDS=123456789
  5. Группа: добавьте бота, напишите сообщение — id группы отрицательный (-100...)
`);
}

const env = { ...loadEnv(envPath), ...process.env };
const token = env.TELEGRAM_BOT_TOKEN?.trim();
const adminIds = parseAdminIds(
  env.TELEGRAM_ADMIN_IDS || env.TELEGRAM_ADMIN_CHAT_ID || env.TELEGRAM_PAYMENTS_CHAT_ID,
);

const viaApiIdx = process.argv.indexOf("--via-api");
const viaApiBase =
  viaApiIdx >= 0 ? process.argv[viaApiIdx + 1]?.replace(/\/$/, "") : null;

console.log("\n🤖 Telegram admin bot test\n");

if (!token) {
  console.error("✗ TELEGRAM_BOT_TOKEN не задан в apps/web/.env.local");
  printChatIdHelp();
  process.exit(1);
}

if (adminIds.length === 0) {
  console.error("✗ TELEGRAM_ADMIN_IDS пуст");
  printChatIdHelp();
  process.exit(1);
}

console.log(`Token:     ${token.slice(0, 8)}…${token.slice(-4)}`);
console.log(`Admin IDs: ${adminIds.join(", ")}`);

if (viaApiBase) {
  const cronSecret = env.CRON_SECRET?.trim();
  const headers = { "Content-Type": "application/json" };
  if (cronSecret) headers.Authorization = `Bearer ${cronSecret}`;

  console.log(`\n→ POST ${viaApiBase}/api/notify\n`);

  try {
    const res = await fetch(`${viaApiBase}/api/notify`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        event: "admin.test",
        message: "✅ Админ-бот работает (via /api/notify)",
        metadata: { source: "test-telegram-admin.mjs" },
      }),
    });
    const json = await res.json().catch(() => ({}));
    console.log(`HTTP ${res.status}`, JSON.stringify(json, null, 2));
    if (!res.ok) process.exit(1);
    if (!json.telegramSent) {
      console.warn("⚠ telegramSent=false — проверьте token и chat_id");
      process.exit(1);
    }
    console.log("\n✓ /api/notify OK\n");
    process.exit(0);
  } catch (e) {
    console.error("✗ API error:", e.message);
    process.exit(1);
  }
}

const text = "✅ Админ-бот работает";
let okCount = 0;

for (const chatId of adminIds) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.ok) {
      console.log(`✓ sent → chat_id ${chatId}`);
      okCount += 1;
    } else {
      console.error(`✗ failed → chat_id ${chatId}`, json?.description ?? res.status);
    }
  } catch (e) {
    console.error(`✗ network error → chat_id ${chatId}:`, e.message);
  }
}

console.log(`\nResult: ${okCount}/${adminIds.length} delivered\n`);

if (okCount === 0) {
  console.log("Подсказка: бот должен получить /start от вас до первой отправки.");
  printChatIdHelp();
  process.exit(1);
}

console.log("Дополнительно:");
console.log("  curl http://localhost:3000/api/auth/status  → telegramNotifyConfigured");
console.log("  node apps/web/scripts/test-telegram-admin.mjs --via-api http://localhost:3000\n");
