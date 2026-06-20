#!/usr/bin/env node
/**
 * Проверка DNS и доступности production (sonogyn-pro.ru).
 * Usage: node scripts/check-production-dns.mjs
 */
import { execSync } from "node:child_process";
import dns from "node:dns/promises";

const DOMAIN = "sonogyn-pro.ru";
const WWW = `www.${DOMAIN}`;
const VERCEL_A = ["76.76.21.21", "76.76.21.22"];
const VERCEL_FALLBACK = "https://sonogyn-pro-web-ravshan-s-projects3.vercel.app";

function digShort(name, type = "A") {
  try {
    return execSync(`dig +short ${name} ${type}`, { encoding: "utf8" })
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function resolve4(host) {
  try {
    return await dns.resolve4(host);
  } catch {
    return [];
  }
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}
function fail(msg) {
  console.log(`❌ ${msg}`);
}
function warn(msg) {
  console.log(`⚠️  ${msg}`);
}

console.log(`\n🌐 Production DNS · ${DOMAIN}\n`);

const apexA = digShort(DOMAIN, "A");
const apexCname = digShort(DOMAIN, "CNAME");
const wwwA = digShort(WWW, "A");
const wwwCname = digShort(WWW, "CNAME");

console.log("Текущие записи:");
console.log(`  ${DOMAIN} A:     ${apexA.join(", ") || "(нет)"}`);
console.log(`  ${DOMAIN} CNAME: ${apexCname.join(", ") || "(нет)"}`);
console.log(`  ${WWW} A:         ${wwwA.join(", ") || "(нет)"}`);
console.log(`  ${WWW} CNAME:     ${wwwCname.join(", ") || "(нет)"}`);
console.log("");

const badApex = apexA.filter((ip) => !VERCEL_A.includes(ip));
const hasConflict = apexA.length > 0 && apexCname.length > 0;

if (hasConflict) {
  fail("Конфликт DNS: одновременно A и CNAME на apex (@) — так быть не должно.");
}
if (badApex.length > 0) {
  fail(`A-записи apex указывают не на Vercel: ${badApex.join(", ")}`);
  console.log(`     Нужно: ${VERCEL_A.join(" или ")}`);
}

if (apexA.some((ip) => VERCEL_A.includes(ip)) && !hasConflict) {
  ok("A-запись apex указывает на Vercel");
}

try {
  const res = await fetch(`https://${DOMAIN}/`, {
    signal: AbortSignal.timeout(15_000),
    redirect: "manual",
  });
  ok(`HTTPS ${DOMAIN} → HTTP ${res.status}`);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  fail(`HTTPS ${DOMAIN} → ${msg}`);
  if (/reset|ECONNREFUSED|timeout/i.test(msg)) {
    warn("Connection reset = браузер попадает не на Vercel SSL (часто неверные A в Nethouse).");
  }
}

try {
  const res = await fetch(`${VERCEL_FALLBACK}/api/health`, {
    headers: { "User-Agent": "SonogynProductionCheck/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.json().catch(() => null);
  if (res.ok && body?.status) ok(`Vercel deploy жив → ${VERCEL_FALLBACK} (${body.status})`);
  else warn(`Vercel deploy ответил HTTP ${res.status}`);
} catch (e) {
  fail(`Vercel deploy недоступен → ${e instanceof Error ? e.message : e}`);
}

console.log("\n📋 Исправление в Nethouse (domains.nethouse.ru):");
console.log("  1. Домен sonogyn-pro.ru → DNS / Зона");
console.log("  2. Удалить A → 216.198.79.1 и 216.198.79.65");
console.log("  3. Удалить CNAME apex, если добавляете A (нельзя A+CNAME вместе)");
console.log(`  4. Добавить A @ → ${VERCEL_A[0]}`);
console.log("  5. www → CNAME → cname.vercel-dns.com (без лишних A)");
console.log("  6. Vercel → Project → Settings → Domains → sonogyn-pro.ru → Valid Configuration");
console.log("  7. Подождать 15–60 мин, снова: node scripts/check-production-dns.mjs\n");

const exitBad = badApex.length > 0 || hasConflict;
process.exit(exitBad ? 1 : 0);
