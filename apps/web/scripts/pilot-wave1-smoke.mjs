#!/usr/bin/env node
/**
 * Smoke-тесты пилота (волна 1) — публичные API и ключевые страницы.
 *
 *   node scripts/pilot-wave1-smoke.mjs
 *   BASE_URL=https://sonogyn-pro.ru node scripts/pilot-wave1-smoke.mjs
 *
 * webinars/status в prod требует x-sonogyn-internal-secret (diagnostics).
 * Без секрета 403 — ожидаемо; с SONOGYN_AUTH_INTERNAL_SECRET в env — полный check.
 */
const BASE = (process.env.BASE_URL ?? "https://sonogyn-pro.ru").replace(/\/$/, "");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

/** Only from process.env — не тянем .env.local (часто ≠ prod secret → ложный 403). */
const INTERNAL_SECRET = process.env.SONOGYN_AUTH_INTERNAL_SECRET?.trim() || "";

const checks = [
  { name: "auth/status", path: "/api/auth/status", expectJson: true },
  {
    name: "webinars/status",
    path: "/api/webinars/status",
    expectJson: true,
    /** 403 = diagnostics gate на prod; полный check только с SECRET в env */
    allowDiagnosticsForbidden: true,
  },
  { name: "webinars catalog", path: "/api/webinars", expectJson: true },
  { name: "reports hub", path: "/reports", expectRedirect: true },
  { name: "register", path: "/register", expectRedirect: true },
  { name: "fetal-anatomy module", path: "/tools/refs/fetal-anatomy-22-views", expectRedirect: true },
  { name: "BI-RADS hub", path: "/tools/calc/rads/bi-rads", expectOkOrRedirect: true },
  { name: "evidence-assistant page", path: "/tools/refs/evidence-assistant", expectRedirect: true },
  { name: "profile page", path: "/profile", expectRedirect: true },
];

async function runOne(check) {
  const headers = { "User-Agent": UA, Accept: "application/json,text/html" };
  if (check.name === "webinars/status" && INTERNAL_SECRET) {
    headers["x-sonogyn-internal-secret"] = INTERNAL_SECRET;
  }
  const res = await fetch(`${BASE}${check.path}`, {
    headers,
    redirect: "manual",
  });
  const okStatus =
    res.status === 200 ||
    (check.expectRedirect && (res.status === 307 || res.status === 308 || res.status === 302)) ||
    (check.expectOkOrRedirect &&
      (res.status === 200 || res.status === 307 || res.status === 308 || res.status === 302)) ||
    (check.allowDiagnosticsForbidden && res.status === 403);
  let detail = String(res.status);
  if (check.name === "webinars/status" && res.status === 403) {
    detail += " (diagnostics gated — OK)";
  }
  if (check.expectJson && res.status === 200) {
    try {
      const body = await res.json();
      if (check.name === "webinars/status") detail += ` ok=${body.ok}`;
      if (check.name === "webinars catalog") detail += ` upcoming=${body.upcoming?.length ?? "?"}`;
      if (check.name === "auth/status") detail += ` smsReady=${body.features?.smsReady ?? body.smsReady ?? "?"}`;
    } catch {
      detail += " (invalid json)";
      return { name: check.name, ok: false, detail };
    }
  }
  return { name: check.name, ok: okStatus, detail };
}

async function main() {
  console.log(`\n🧪 Pilot wave-1 smoke · ${BASE}\n`);
  let failed = 0;
  for (const check of checks) {
    const result = await runOne(check);
    const mark = result.ok ? "✓" : "✗";
    if (!result.ok) failed += 1;
    console.log(`${mark} ${result.name}: ${result.detail}`);
  }
  console.log(failed ? `\n${failed} failed\n` : "\nAll checks passed\n");
  console.log("Ручные шаги пилота (email-only):");
  console.log("  1. Регистрация: /register → письмо Sonogyn-pro@mail.ru → подтверждение");
  console.log("  2. Библиотека: /tools/refs — чек-листы, learning paths, set-pieces");
  console.log("  3. Mobile (опц.): EAS build + login\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
