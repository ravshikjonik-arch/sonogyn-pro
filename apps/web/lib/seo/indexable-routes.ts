import type { MetadataRoute } from "next";

import { isCopyrightLockedRoute } from "@/lib/copyright/book-content-gate";
import { CALCULATOR_SEO_REGISTRY } from "@/lib/seo/calculator-seo-registry";

type SitemapRow = {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
};

/**
 * Маршруты для sitemap.xml.
 * Только канонические публичные URL (без legacy-редиректов /calculators, /library, /assistant).
 * Исключения: auth/PHI/admin, API, noindex, copyright-locked атласы.
 * Custom domain: HTML проксируется в middleware (`custom-domain-proxy.ts`).
 */
const MARKETING_ROUTES: SitemapRow[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/landing", priority: 1, changeFrequency: "weekly" },
  { path: "/home", priority: 0.95, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.65, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/lp/orads-iota", priority: 0.75, changeFrequency: "monthly" },
];

/** Хабы продукта (soft-open, indexable). */
const HUB_ROUTES: SitemapRow[] = [
  { path: "/tools", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tools/calc", priority: 0.88, changeFrequency: "weekly" },
  { path: "/tools/obstetrics", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools/gynecology", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools/o-rads", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tools/pharmacy", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tools/repos", priority: 0.7, changeFrequency: "weekly" },
  { path: "/tools/refs", priority: 0.75, changeFrequency: "weekly" },
  { path: "/tools/mapping", priority: 0.75, changeFrequency: "weekly" },
  { path: "/cases", priority: 0.7, changeFrequency: "daily" },
  { path: "/feed", priority: 0.55, changeFrequency: "daily" },
  { path: "/ai/consultants", priority: 0.75, changeFrequency: "weekly" },
  { path: "/ai/ask", priority: 0.65, changeFrequency: "weekly" },
];

/** 3D / анатомические комнаты (канон /tools/mapping/*). */
const MAPPING_ROUTES: SitemapRow[] = [
  { path: "/tools/mapping/uterus", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools/mapping/ovary", priority: 0.75, changeFrequency: "weekly" },
  { path: "/tools/mapping/breast", priority: 0.75, changeFrequency: "weekly" },
  { path: "/tools/mapping/endometriosis", priority: 0.75, changeFrequency: "weekly" },
  { path: "/tools/mapping/pelvis", priority: 0.7, changeFrequency: "weekly" },
];

/** AI consultants (публичные; us-prep — noindex, не включаем). */
const AI_CONSULTANT_ROUTES: SitemapRow[] = [
  { path: "/ai/consultants/fmf", priority: 0.85, changeFrequency: "weekly" },
  { path: "/ai/consultants/fmf/guided", priority: 0.7, changeFrequency: "monthly" },
  { path: "/ai/consultants/gynecology", priority: 0.75, changeFrequency: "weekly" },
  { path: "/ai/consultants/obstetrics", priority: 0.75, changeFrequency: "weekly" },
  { path: "/ai/consultants/obstetrics/expert", priority: 0.7, changeFrequency: "monthly" },
  { path: "/ai/consultants/vascular", priority: 0.7, changeFrequency: "monthly" },
];

/**
 * Статические /tools/refs/* без copyright-lock и без noindex.
 * Динамические [id]/[slug]/[courseId] не перечисляем — нет стабильного SSOT списка в sitemap.
 */
const REF_STATIC_ROUTES: SitemapRow[] = [
  { path: "/tools/refs/sources", priority: 0.65, changeFrequency: "monthly" },
  { path: "/tools/refs/guidelines", priority: 0.7, changeFrequency: "weekly" },
  { path: "/tools/refs/consensus", priority: 0.65, changeFrequency: "monthly" },
  { path: "/tools/refs/norms", priority: 0.65, changeFrequency: "monthly" },
  { path: "/tools/refs/nosologies", priority: 0.65, changeFrequency: "weekly" },
  { path: "/tools/refs/evidence", priority: 0.65, changeFrequency: "weekly" },
  { path: "/tools/refs/evidence-sources", priority: 0.55, changeFrequency: "monthly" },
  { path: "/tools/refs/evidence-assistant", priority: 0.55, changeFrequency: "monthly" },
  { path: "/tools/refs/basic-course", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tools/refs/exam-checklists", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tools/refs/exam-set-pieces", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tools/refs/learning-paths", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tools/refs/quiz-hub", priority: 0.65, changeFrequency: "weekly" },
  { path: "/tools/refs/case-library", priority: 0.6, changeFrequency: "weekly" },
  { path: "/tools/refs/clinic-accreditation", priority: 0.5, changeFrequency: "monthly" },
  { path: "/tools/refs/cme-tracker", priority: 0.5, changeFrequency: "monthly" },
  { path: "/tools/refs/ultrasound-safety", priority: 0.55, changeFrequency: "yearly" },
  { path: "/tools/refs/patient-information", priority: 0.5, changeFrequency: "yearly" },
  { path: "/tools/refs/fetal-biometry-formulas", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tools/refs/fetal-anatomy-22-views", priority: 0.65, changeFrequency: "monthly" },
  { path: "/tools/refs/fetal-doppler-first-trimester", priority: 0.65, changeFrequency: "monthly" },
  { path: "/tools/refs/fetal-spine", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tools/refs/cervix-pathology", priority: 0.65, changeFrequency: "monthly" },
  { path: "/tools/refs/orads-guide", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tools/refs/orads-echograms", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tools/refs/iota-terms-2026", priority: 0.65, changeFrequency: "monthly" },
  { path: "/tools/refs/isuog-guidelines", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tools/refs/rcog-green-top", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tools/refs/rcog-green-top/quiz", priority: 0.5, changeFrequency: "monthly" },
  { path: "/tools/refs/vascular-ultrasound", priority: 0.55, changeFrequency: "monthly" },
  { path: "/tools/refs/webinars", priority: 0.55, changeFrequency: "weekly" },
  { path: "/tools/refs/courses", priority: 0.55, changeFrequency: "weekly" },
];

/** Калькуляторы из SEO-реестра + пути вне реестра, но публичные. */
const EXTRA_CALC_ROUTES: SitemapRow[] = [
  { path: "/tools/calc/gyn/ultrasound-10-steps", priority: 0.75, changeFrequency: "weekly" },
];

/** Клинические отчёты / прочие публичные поверхности. */
const OTHER_PUBLIC_ROUTES: SitemapRow[] = [
  { path: "/reports", priority: 0.5, changeFrequency: "monthly" },
  { path: "/reports/adnex", priority: 0.55, changeFrequency: "monthly" },
  { path: "/reports/obstetric", priority: 0.55, changeFrequency: "monthly" },
  { path: "/reports/thyroid", priority: 0.55, changeFrequency: "monthly" },
  { path: "/breast-us", priority: 0.55, changeFrequency: "monthly" },
  { path: "/musa/adenomyosis", priority: 0.55, changeFrequency: "monthly" },
];

function calculatorRows(): SitemapRow[] {
  return CALCULATOR_SEO_REGISTRY.map((entry) => ({
    path: entry.path,
    priority:
      entry.path.includes("/tools/calc/rads") || entry.path.includes("/ai/consultants/fmf")
        ? 0.85
        : 0.75,
    changeFrequency: "weekly" as const,
  }));
}

/** Явный noindex / служебное — не в sitemap даже если route существует. */
const EXPLICIT_EXCLUDE = new Set([
  "/tools/refs/ambulatory-intake",
  "/ai/consultants/us-prep",
  "/offline",
  "/login",
  "/register",
  "/verify",
  "/verify-phone",
  "/achievements",
  "/ai/workspace",
  "/cases/new",
  "/tools/refs/my-courses",
  "/demo/emr",
  "/demo/patient-card",
  "/demo/roles",
  "/voice-reader",
  "/elastography",
]);

function isExcluded(path: string): boolean {
  if (EXPLICIT_EXCLUDE.has(path)) return true;
  if (isCopyrightLockedRoute(path)) return true;
  if (path.startsWith("/api/")) return true;
  if (path.startsWith("/admin") || path.startsWith("/author")) return true;
  if (path.startsWith("/patients") || path.startsWith("/profile")) return true;
  if (path.startsWith("/dashboard") || path.startsWith("/paywall")) return true;
  if (path.startsWith("/auth/")) return true;
  return false;
}

export function getIndexableSitemapRows(): SitemapRow[] {
  const seen = new Set<string>();
  const rows: SitemapRow[] = [];

  const all = [
    ...MARKETING_ROUTES,
    ...HUB_ROUTES,
    ...MAPPING_ROUTES,
    ...AI_CONSULTANT_ROUTES,
    ...REF_STATIC_ROUTES,
    ...EXTRA_CALC_ROUTES,
    ...OTHER_PUBLIC_ROUTES,
    ...calculatorRows(),
  ];

  for (const row of all) {
    if (seen.has(row.path)) continue;
    if (isExcluded(row.path)) continue;
    seen.add(row.path);
    rows.push(row);
  }

  return rows.sort((a, b) => b.priority - a.priority || a.path.localeCompare(b.path));
}
