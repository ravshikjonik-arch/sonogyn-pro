#!/usr/bin/env node
/**
 * audit-smoke.mjs — проверка SEO-гигиены и доступности страниц без зависимостей.
 *
 * Запуск:
 *   node scripts/audit-smoke.mjs                        # http://localhost:3000
 *   node scripts/audit-smoke.mjs --base https://sonogyn-pro.ru
 *   BASE_URL=http://localhost:3000 node scripts/audit-smoke.mjs
 *   node scripts/audit-smoke.mjs --limit 10 --verbose
 *   node scripts/audit-smoke.mjs --pages /,/pricing,/tools/o-rads
 *   node scripts/audit-smoke.mjs --json > report.json
 *
 * Код возврата 1, если есть провалы — можно вешать в CI.
 *
 * Что проверяется на каждой странице:
 *   - HTTP 200 (не редирект на чужой хост, не 404)
 *   - это не bootstrap-заглушка (размер > 5000 байт, нет «Загрузка кабинета…»)
 *   - есть <title>, он не дублирует бренд, длина <= 65
 *   - есть <meta description> длиной 90..160
 *   - есть абсолютный canonical, совпадающий с путём
 *   - ровно один <h1>
 *   - og:image отдаёт 200
 *   - в HTML нет *.vercel.app
 *   - в sitemap нет URL с редиректом (проверяется по факту ответа)
 *
 * Чего скрипт не делает: Core Web Vitals и a11y — для них Lighthouse / @axe-core/cli.
 */

const DEFAULTS = ['/', '/pricing', '/tools', '/tools/calc', '/tools/o-rads', '/privacy'];

const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const BASE = (getArg('base') || process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const LIMIT = Number(getArg('limit', 0)) || 0;
const CONCURRENCY = Number(getArg('concurrency', 6)) || 6;
const JSON_OUT = hasFlag('json');
const VERBOSE = hasFlag('verbose');
const PAGES_ARG = getArg('pages');
const UA = 'SonoGyn-AuditSmoke/1.0 (+audit)';

const c = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', dim: '\x1b[2m', bold: '\x1b[1m',
};

async function fetchText(url, opts = {}) {
  const started = performance.now();
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    ...opts,
  });
  const body = await res.text();
  return { res, body, ms: Math.round(performance.now() - started), ttfb: 0, size: Buffer.byteLength(body) };
}

function first(re, html) {
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
}

function analyze(path, html, res) {
  const url = new URL(path, BASE).toString();
  const fails = [];
  const warns = [];
  const info = { path, url, status: res.status, size: Buffer.byteLength(html) };

  const isShell = info.size < 5000 || /Загрузка кабинета|Загрузка формы/.test(html.slice(0, 4000));
  if (res.status !== 200) fails.push(`HTTP ${res.status} (ожидался 200)${res.redirected ? ' после редиректа на ' + res.url : ''}`);
  if (isShell) fails.push(`bootstrap-заглушка: ${info.size} байт, контента нет`);

  const title = decode(first(/<title[^>]*>([\s\S]*?)<\/title>/i, html));
  info.title = title;
  if (!title) fails.push('нет <title>');
  else {
    if (title.length > 65) warns.push(`title ${title.length} симв. — обрежется`);
    if (/SonoGyn Pro\s*\|\s*SonoGyn Pro/i.test(title)) fails.push('дубль бренда в title');
  }

  const desc = decode(first(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i, html))
    || decode(first(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i, html));
  info.description = desc;
  if (!desc) fails.push('нет meta description');
  else if (desc.length < 90) warns.push(`description ${desc.length} симв. — коротко`);
  else if (desc.length > 160) warns.push(`description ${desc.length} симв. — обрежется`);

  const canonical = first(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i, html)
    || first(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i, html);
  info.canonical = canonical;
  if (!canonical) fails.push('нет canonical');
  else {
    try {
      const cPath = new URL(canonical, BASE).pathname.replace(/\/+$/, '') || '/';
      const pPath = new URL(url).pathname.replace(/\/+$/, '') || '/';
      if (cPath !== pPath) warns.push(`canonical указывает на ${cPath}, а страница ${pPath}`);
      if (!/^https?:\/\//.test(canonical)) warns.push('canonical относительный');
    } catch { warns.push('canonical не парсится'); }
  }

  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((m) => decode(m[1].replace(/<[^>]+>/g, '')).trim())
    .filter(Boolean);
  info.h1 = h1s;
  if (h1s.length === 0) fails.push('нет <h1>');
  else if (h1s.length > 1) fails.push(`${h1s.length} тега <h1>`);

  const robots = first(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i, html);
  info.robots = robots;
  if (/noindex/i.test(robots)) fails.push(`noindex на публичной странице`);

  if (/vercel\.app/i.test(html)) fails.push('в HTML есть *.vercel.app (ассеты/ссылки не с домена)');

  const ogImage = first(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i, html);
  info.ogImage = ogImage;
  if (!ogImage) warns.push('нет og:image');
  return { info, fails, warns };
}

async function checkOgImage(ogImage) {
  if (!ogImage) return true;
  try {
    const r = await fetch(new URL(ogImage, BASE), { method: 'GET', signal: AbortSignal.timeout(15000), headers: { 'user-agent': UA } });
    return r.ok;
  } catch {
    return false;
  }
}

async function getPaths() {
  if (PAGES_ARG) return PAGES_ARG.split(',').map((p) => p.trim()).filter(Boolean);
  try {
    const { res, body } = await fetchText(`${BASE}/sitemap.xml`);
    if (res.ok) {
      const locs = [...body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)]
        .map((m) => m[1].trim())
        .filter((u) => {
          try { return new URL(u).host === new URL(BASE).host; } catch { return false; }
        })
        .map((u) => new URL(u).pathname || '/');
      if (locs.length) return [...new Set(locs)];
    }
  } catch { /* нет sitemap — идём по дефолту */ }
  return DEFAULTS;
}

async function pool(items, size, worker) {
  const out = [];
  let i = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(runners);
  return out;
}

const paint = (ok, text) => (process.stdout.isTTY ? `${ok ? c.green : c.red}${text}${c.reset}` : text);

async function main() {
  let paths = await getPaths();
  if (LIMIT) paths = paths.slice(0, LIMIT);

  if (!JSON_OUT) {
    console.log(`\n${c.bold}audit-smoke${c.reset} ${c.dim}→ ${BASE}${c.reset}`);
    console.log(`${c.dim}страниц: ${paths.length}, параллельно: ${CONCURRENCY}${c.reset}\n`);
  }

  const results = await pool(paths, CONCURRENCY, async (path) => {
    try {
      const { res, body } = await fetchText(new URL(path, BASE).toString());
      const r = analyze(path, body, res);
      if (r.info.ogImage && !(await checkOgImage(r.info.ogImage))) r.fails.push(`og:image 404 (${r.info.ogImage})`);
      return r;
    } catch (e) {
      return { info: { path }, fails: [`сеть/таймаут: ${e.message}`], warns: [] };
    }
  });

  if (JSON_OUT) {
    const summary = results.reduce(
      (a, r) => ({ pages: a.pages + 1, failed: a.failed + (r.fails.length ? 1 : 0), issues: a.issues + r.fails.length }),
      { pages: 0, failed: 0, issues: 0 },
    );
    console.log(JSON.stringify({ base: BASE, summary, results }, null, 2));
    process.exit(summary.failed ? 1 : 0);
  }

  for (const r of results) {
    const ok = r.fails.length === 0;
    const head = `${ok ? paint(true, '✓') : paint(false, '✗')} ${r.info.path}`;
    const meta = r.info.size ? `${c.dim}${r.info.size} B${c.reset}` : '';
    console.log(`${head}  ${meta}`);
    for (const f of r.fails) console.log(`   ${paint(false, '✗')} ${f}`);
    if (VERBOSE) {
      for (const w of r.warns) console.log(`   ${c.yellow}•${c.reset} ${w}`);
      if (r.info.title) console.log(`   ${c.dim}title: ${r.info.title}${c.reset}`);
    }
  }

  const failed = results.filter((r) => r.fails.length);
  const warns = results.reduce((a, r) => a + r.warns.length, 0);
  const shell = results.filter((r) => r.fails.some((f) => f.includes('заглушка'))).length;

  console.log(`\n${c.bold}Итого:${c.reset} ${results.length} страниц, ${failed.length ? paint(false, failed.length + ' с провалами') : paint(true, '0 провалов')}, ${warns} предупреждений`);
  if (shell) console.log(`${paint(false, '⚠')} ${shell} страниц отдают оболочку без контента — начните с фикса домена/SSR.`);
  if (failed.length && VERBOSE) {
    const byCheck = {};
    for (const r of failed) for (const f of r.fails) {
      const key = f.replace(/[:：].*/, '').slice(0, 48);
      byCheck[key] = (byCheck[key] || 0) + 1;
    }
    console.log(`\n${c.bold}Частые проблемы:${c.reset}`);
    for (const [k, v] of Object.entries(byCheck).sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${v}× ${k}`);
  }
  console.log('');
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error('audit-smoke упал:', e);
  process.exit(2);
});
