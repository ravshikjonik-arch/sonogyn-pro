#!/usr/bin/env node
/**
 * Smoke-тесты пилота (волна 1) — публичные API и ключевые страницы.
 *
 *   node scripts/pilot-wave1-smoke.mjs
 *   BASE_URL=https://sonogyn-pro.ru node scripts/pilot-wave1-smoke.mjs
 */
const BASE = (process.env.BASE_URL ?? "https://sonogyn-pro.ru").replace(/\/$/, "");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const checks = [
  { name: "auth/status", path: "/api/auth/status", expectJson: true },
  { name: "webinars/status", path: "/api/webinars/status", expectJson: true },
  { name: "webinars catalog", path: "/api/webinars", expectJson: true },
  { name: "reports hub", path: "/reports", expectRedirect: true },
  { name: "register", path: "/register", expectRedirect: true },
  { name: "fetal-anatomy module", path: "/tools/refs/fetal-anatomy-22-views", expectRedirect: true },
];

async function runOne(check) {
  const res = await fetch(`${BASE}${check.path}`, {
    headers: { "User-Agent": UA, Accept: "application/json,text/html" },
    redirect: "manual",
  });
  const okStatus =
    res.status === 200 ||
    (check.expectRedirect && (res.status === 307 || res.status === 308 || res.status === 302));
  let detail = String(res.status);
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
  console.log("Ручные шаги пилота (TODO.md):");
  console.log("  1. SMS auth на /register с реальным +7");
  console.log("  2. EAS: cd apps/mobile && npm run eas:android:preview");
  console.log("  3. Discussions: кейс → вопрос → push → deep link\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
