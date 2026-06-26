#!/usr/bin/env node
/**
 * Logged-in smoke: /feed titles + /cases без Realtime crash.
 * Usage (from apps/web):
 *   npm run test:feed-cases-smoke
 *   BASE_URL=https://sonogyn-pro.ru npm run test:feed-cases-smoke
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const base = (process.env.BASE_URL ?? "https://sonogyn-pro.ru").replace(/\/$/, "");
const ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 SonogynFeedCasesSmoke/1.0";

function loadEnv() {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const BAD_TITLE = /feed seed|pilot e2e|202\d-\d{2}-\d{2}t/i;
const CASES_CRASH = /cannot add postgres_changes|doctor_presence_roster after subscribe|Application error/i;
const CASES_CLIENT_ERROR = /postgres_changes|doctor_presence_roster|RealtimeChannel/i;

let failed = 0;

function ok(label) {
  console.log(`✅ ${label}`);
}
function fail(label, detail) {
  console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  failed += 1;
}

function collectSetCookies(res) {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  const raw = res.headers.get("set-cookie");
  if (!raw) return [];
  return raw.split(/,(?=[^;]+?=)/);
}

function cookieHeaderFromSetCookies(setCookies) {
  return setCookies.map((c) => c.split(";")[0].trim()).filter(Boolean).join("; ");
}

async function signIn(email, password) {
  const res = await fetch(`${base}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": ua },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  const cookies = cookieHeaderFromSetCookies(collectSetCookies(res));
  return { status: res.status, json, cookies };
}

async function establishSessionViaMagicLink(admin, email) {
  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const token = linkData?.properties?.hashed_token;
  if (error || !token) {
    return { ok: false, message: error?.message ?? "generateLink: no hashed_token" };
  }
  const verifyUrl = `${base}/auth/callback?token_hash=${encodeURIComponent(token)}&type=email&next=${encodeURIComponent("/feed")}`;
  const res = await fetch(verifyUrl, {
    redirect: "manual",
    headers: { "User-Agent": ua },
  });
  const cookies = cookieHeaderFromSetCookies(collectSetCookies(res));
  if (!cookies) {
    return { ok: false, message: `auth/callback HTTP ${res.status}, нет cookies` };
  }
  const sessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: cookies, "User-Agent": ua },
  });
  const session = await sessionRes.json().catch(() => ({}));
  if (!session?.user?.id) {
    return { ok: false, message: "session после magiclink пустая" };
  }
  return { ok: true, cookies };
}

async function establishSession(email, password, admin) {
  const login = await signIn(email, password);
  if (login.json?.ok && login.cookies) {
    return { ok: true, cookies: login.cookies, via: "password" };
  }
  if (admin) {
    const magic = await establishSessionViaMagicLink(admin, email);
    if (magic.ok) return { ...magic, via: "magiclink" };
    return { ok: false, message: magic.message ?? login.json?.error ?? "sign-in failed" };
  }
  return { ok: false, message: login.json?.error ?? `HTTP ${login.status}` };
}

async function getPage(pathname, cookies) {
  const res = await fetch(`${base}${pathname}`, {
    headers: { "User-Agent": ua, Cookie: cookies },
    redirect: "follow",
    cache: "no-store",
  });
  const text = await res.text();
  return { status: res.status, url: res.url, text };
}

function cookiesForPlaywright(cookieHeader) {
  const host = new URL(base).hostname;
  return cookieHeader
    .split("; ")
    .map((pair) => {
      const eq = pair.indexOf("=");
      if (eq < 0) return null;
      return {
        name: pair.slice(0, eq).trim(),
        value: pair.slice(eq + 1),
        domain: host,
        path: "/",
      };
    })
    .filter(Boolean);
}

/** Client-side Realtime check (DoctorPresence) — только в headless Chromium. */
async function clientCasesSmoke(cookies) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return { skipped: true, reason: "playwright not installed" };
  }

  try {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ userAgent: ua });
      await context.addCookies(cookiesForPlaywright(cookies));
      const page = await context.newPage();
      const errors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      page.on("pageerror", (err) => errors.push(String(err.message ?? err)));

      await page.goto(`${base}/cases`, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page.waitForTimeout(4000);

      const bodyText = await page.locator("body").innerText().catch(() => "");
      const bad = [...errors, bodyText].some(
        (line) => CASES_CRASH.test(line) || CASES_CLIENT_ERROR.test(line),
      );
      return { skipped: false, ok: !bad, errors: errors.slice(0, 5) };
    } finally {
      await browser.close();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/Executable doesn't exist|playwright install/i.test(msg)) {
      return { skipped: true, reason: "npx playwright install" };
    }
    return { skipped: true, reason: msg.slice(0, 120) };
  }
}

console.log(`\n🔐 Feed + Cases logged-in smoke · ${base}\n`);

const env = loadEnv();
const email = env.DEV_LOGIN_EMAIL?.trim();
const password = env.DEV_LOGIN_PASSWORD;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!email || !password) {
  fail("env", "DEV_LOGIN_EMAIL / DEV_LOGIN_PASSWORD в .env.local");
  process.exit(1);
}

let admin = null;
if (supabaseUrl && serviceKey) {
  admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: rows, error } = await admin
    .from("cases")
    .select("id,title,tags,lifecycle_status,status,is_public")
    .eq("status", "published")
    .eq("is_public", true)
    .eq("lifecycle_status", "confirmed")
    .order("editorial_priority", { ascending: false })
    .limit(20);

  if (error) {
    fail("Supabase feed query", error.message);
  } else {
    const titles = (rows ?? []).map((r) => r.title ?? "");
    const bad = titles.filter((t) => BAD_TITLE.test(t));
    if (bad.length) fail("Editorial titles (DB)", bad.join(" | "));
    else ok(`Confirmed cases in DB: ${titles.length} · без Feed seed / Pilot E2E / ISO`);
    for (const t of titles.slice(0, 5)) console.log(`   · ${t}`);
  }
} else {
  console.log("⏭  Supabase service role — пропуск DB-проверки");
}

const session = await establishSession(email, password, admin);
if (!session.ok || !session.cookies) {
  fail("Session", session.message ?? "не удалось установить сессию");
  console.log(`\nИтог: ${failed} ошибок\n`);
  process.exit(1);
}
ok(`Вход ${email} (${session.via})`);

const cookies = session.cookies;

const feed = await getPage("/feed", cookies);
if (feed.status !== 200) fail("/feed HTML", `HTTP ${feed.status} → ${feed.url}`);
else if (feed.url.includes("/login")) fail("/feed HTML", "редirect на login");
else if (BAD_TITLE.test(feed.text)) {
  const m = feed.text.match(/Feed seed[^<]{0,80}|Pilot E2E[^<]{0,80}|202\d-\d{2}-\d{2}T[^<]{0,40}/i);
  fail("/feed HTML", `тестовый title: ${m?.[0]?.slice(0, 60) ?? "pattern match"}`);
} else ok("/feed HTML → 200 · чистые title");

const cases = await getPage("/cases", cookies);
if (cases.status !== 200) fail("/cases HTML", `HTTP ${cases.status} → ${cases.url}`);
else if (cases.url.includes("/login")) fail("/cases HTML", "редirect на login");
else if (CASES_CRASH.test(cases.text)) {
  const m = cases.text.match(CASES_CRASH);
  fail("/cases HTML", m?.[0] ?? "crash pattern");
} else ok("/cases HTML → 200 · без Realtime crash в SSR");

const client = await clientCasesSmoke(cookies);
if (client.skipped) {
  console.log(`⏭  /cases client (Playwright): ${client.reason}`);
} else if (client.ok) {
  ok("/cases client · без Realtime / DoctorPresence ошибок");
} else {
  fail("/cases client", client.errors?.join(" | ") || "console/pageerror");
}

console.log(`\nИтог: ${failed} ошибок\n`);
process.exit(failed > 0 ? 1 : 0);
