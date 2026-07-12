#!/usr/bin/env node
/**
 * Тест SMTP (Mailgun) из apps/web/.env.local
 *
 * Usage:
 *   node scripts/test-smtp-email.mjs
 *   node scripts/test-smtp-email.mjs user@example.com
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

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

const env = { ...process.env, ...loadEnv(envPath) };

const host = env.SMTP_HOST?.trim();
const connectHost = env.SMTP_CONNECT_HOST?.trim();
const port = Number.parseInt(env.SMTP_PORT?.trim() ?? "587", 10);
const user = env.SMTP_USER?.trim();
const password = (env.SMTP_PASSWORD ?? env.SMTP_PASS)?.trim();
const from = env.SMTP_FROM?.trim() || (user ? `SonoGyn Pro <${user}>` : undefined);
const to = process.argv[2]?.trim() || env.DEV_LOGIN_EMAIL?.trim();

console.log("📧 SMTP test (Mailgun)\n");

if (!host || !user || !password || !from) {
  console.error("✗ Не хватает переменных: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD");
  process.exit(1);
}

if (!to) {
  console.error("✗ Укажите email: node scripts/test-smtp-email.mjs you@example.com");
  console.error("  или задайте DEV_LOGIN_EMAIL в .env.local");
  process.exit(1);
}

console.log(`  Host: ${host}:${port}${connectHost ? ` via ${connectHost}` : ""}`);
console.log(`  User: ${user}`);
console.log(`  From: ${from}`);
console.log(`  To:   ${to}\n`);

const portsToTry = [
  port,
  ...(port !== 587 ? [587] : []),
  ...(port !== 2525 ? [2525] : []),
  ...(port !== 465 ? [465] : []),
].filter((p, i, arr) => arr.indexOf(p) === i);

const code = String(Math.floor(100000 + Math.random() * 900000));
const mail = {
  from,
  to,
  subject: "SonoGyn Pro — тест SMTP",
  text: [
    "Тестовое письмо SonoGyn Pro",
    "",
    `Код (пример): ${code}`,
    "",
    "Если письмо пришло — SMTP настроен верно.",
  ].join("\n"),
};

let lastError = null;

for (const tryPort of portsToTry) {
  const transport = nodemailer.createTransport({
    host: connectHost || host,
    port: tryPort,
    secure: tryPort === 465,
    family: 4,
    auth: { user, pass: password },
    tls: connectHost ? { servername: host } : undefined,
    requireTLS: tryPort === 587,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  });

  try {
    if (tryPort !== port) {
      console.log(`  Пробуем порт ${tryPort}…`);
    }
    const info = await transport.sendMail(mail);
    console.log("✓ Письмо отправлено");
    console.log(`  port:      ${tryPort}`);
    console.log(`  messageId: ${info.messageId ?? "(нет)"}`);
    console.log(`  response:  ${info.response ?? "(нет)"}`);
    transport.close();
    process.exit(0);
  } catch (err) {
    lastError = err;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ Порт ${tryPort}: ${msg}`);
    transport.close();

    const lower = msg.toLowerCase();
    if (
      lower.includes("activate your mailgun account") ||
      lower.includes("authorized recipients")
    ) {
      break;
    }
  }
}

if (lastError) {
  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  const lower = msg.toLowerCase();
  if (lower.includes("activate your mailgun account")) {
    console.error("\n→ Активируйте аккаунт Mailgun (письмо при регистрации или Resend activation в панели).");
  } else if (lower.includes("authorized recipients")) {
    console.error("\n→ Mailgun Sandbox: Sending → Authorized Recipients → Add →", to);
  } else if (lower.includes("greeting never received") || lower.includes("timeout")) {
    console.error("\n→ Порты 587/465 могут быть заблокированы. Попробуйте SMTP_PORT=2525 в .env.local");
  }
  process.exit(1);
}
