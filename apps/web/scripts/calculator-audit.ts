#!/usr/bin/env node
/**
 * Аудит калькуляторов vs референс OblCalc.
 * Генерирует docs/calculator_audit.md и docs/calculator_coverage_report.md
 *
 * Запуск: npm run calc:audit --workspace=@repo/web
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import {
  APPOINTMENT_CALCULATORS,
  EXTRA_PROJECT_CALCULATORS,
  computeCoverage,
  detectOrphanScreens,
  extractPathname,
  formatAuditMarkdown,
  formatCoverageMarkdown,
  runReferenceAudit,
  validateRoutes,
  type CoverageReport,
} from "@repo/clinical-tools";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../../..");
const WEB_APP = join(REPO_ROOT, "apps/web");
const DOCS_DIR = join(REPO_ROOT, "docs");

function collectNextRoutes(dir: string, base = ""): string[] {
  const routes: string[] = [];
  if (!existsSync(dir)) return routes;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith("_") || entry.startsWith(".")) continue;

    if (entry.startsWith("(") && entry.endsWith(")")) {
      routes.push(...collectNextRoutes(full, base));
      continue;
    }

    const segment = entry.startsWith("[") ? `[${entry.slice(1, -1)}]` : entry;
    const routePath = `${base}/${segment}`.replace(/\/+/g, "/");

    const pageTsx = join(full, "page.tsx");
    const pageTs = join(full, "page.ts");
    if (existsSync(pageTsx) || existsSync(pageTs)) {
      routes.push(routePath || "/");
    }
    routes.push(...collectNextRoutes(full, routePath));
  }
  return routes;
}

function discoverWebRoutes(): Set<string> {
  const appDir = join(WEB_APP, "app");
  const raw = collectNextRoutes(appDir);
  const normalized = new Set<string>();
  for (const r of raw) {
    normalized.add(r === "" ? "/" : r);
  }
  // Статические маршруты вне app tree
  normalized.add("/uterus-3d");
  normalized.add("/assistant/fmf");
  normalized.add("/assistant/gynecology");
  normalized.add("/assistant/obstetrics");
  normalized.add("/library/cervix-pathology");
  return normalized;
}

function main() {
  const generatedAt = new Date().toISOString();
  const audit = runReferenceAudit();
  const cov = computeCoverage(audit);

  const knownRoutes = discoverWebRoutes();
  const allCalcs = [...APPOINTMENT_CALCULATORS, ...EXTRA_PROJECT_CALCULATORS];
  const brokenRoutes = validateRoutes(knownRoutes, allCalcs);

  const menuLinked = new Set<string>([
    "/calculators",
    "/calculators/ob",
    "/calculators/appointment",
    "/calculators/fetal-weight",
    "/calculators/bishop",
    "/calculators/vbac",
    "/calculators/breast-risk",
    "/calculators/cervical-cancer-risk",
    "/calculators/cin-follow-up",
    "/calculators/ovarian-cancer-risk",
    "/calculators/pregnancy-medications",
    "/calculators/o-rads",
    "/calculators/bi-rads",
    "/calculators/endometrium",
    "/calculators/cervical-length",
    "/calculators/ti-rads",
    "/calculators/pop-q",
    "/calculators/colposcopy",
    "/calculators/elastography",
    "/uterus-3d",
    "/assistant/fmf",
  ]);

  const coverage: CoverageReport = {
    ...cov,
    brokenRoutes,
    orphanScreens: detectOrphanScreens(knownRoutes, menuLinked),
    duplicateImplementations: audit.duplicates,
  };

  mkdirSync(DOCS_DIR, { recursive: true });

  const auditPath = join(DOCS_DIR, "calculator_audit.md");
  const coveragePath = join(DOCS_DIR, "calculator_coverage_report.md");

  writeFileSync(auditPath, formatAuditMarkdown(audit, generatedAt), "utf8");
  writeFileSync(coveragePath, formatCoverageMarkdown(audit, coverage, generatedAt), "utf8");

  console.log("\n=== АУДИТ КАЛЬКУЛЯТОРОВ · SonoGyn vs OblCalc ===\n");
  console.log(`Референс: ${cov.referenceTotal} | Реализовано: ${cov.implementedCount} | Частично: ${cov.partialCount} | Отсутствует: ${cov.missingCount}`);
  console.log(`Покрытие: ${cov.coveragePercent}% (взвешенное: ${cov.weightedCoveragePercent}%)\n`);

  console.log("1. УЖЕ РЕАЛИЗОВАНО:");
  for (const c of audit.implemented) console.log(`   ✓ ${c.title}`);

  console.log("\n2. ЧАСТИЧНО:");
  for (const c of audit.partial) console.log(`   ~ ${c.title}`);

  console.log("\n3. ОТСУТСТВУЕТ:");
  for (const c of audit.missing) console.log(`   ✗ ${c.title}`);

  console.log("\n4. ДУБЛИКАТЫ:", audit.duplicates.length);
  console.log("5. НЕИСПОЛЬЗУЕМЫЕ:", audit.unused.length);

  console.log("\n--- Проверка маршрутов ---");
  if (brokenRoutes.length === 0) console.log("✅ Битых роутов нет");
  else brokenRoutes.forEach((b) => console.log(`❌ ${b.webHref} — ${b.title}`));

  console.log(`\n📄 ${relative(REPO_ROOT, auditPath)}`);
  console.log(`📄 ${relative(REPO_ROOT, coveragePath)}\n`);
}

main();
