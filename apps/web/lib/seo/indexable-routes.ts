import type { MetadataRoute } from "next";

import { CALCULATOR_SEO_REGISTRY } from "@/lib/seo/calculator-seo-registry";

type SitemapRow = {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
};

/**
 * Маршруты для sitemap.xml.
 * Next.js App Router на Vercel отдаёт каждый path как SSR/SSG — отдельный SPA fallback не требуется.
 * Custom domain: HTML проксируется в middleware (`custom-domain-proxy.ts`).
 */
const MARKETING_AND_HUB_ROUTES: SitemapRow[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/landing", priority: 1, changeFrequency: "weekly" },
  { path: "/home", priority: 0.95, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.65, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/lp/orads-iota", priority: 0.75, changeFrequency: "monthly" },
  { path: "/tools", priority: 0.7, changeFrequency: "weekly" },
  { path: "/tools/refs", priority: 0.55, changeFrequency: "weekly" },
];

function calculatorRows(): SitemapRow[] {
  return CALCULATOR_SEO_REGISTRY.map((entry) => ({
    path: entry.path,
    priority: entry.path.includes("/tools/calc/rads") || entry.path.includes("/ai/consultants/fmf") ? 0.85 : 0.75,
    changeFrequency: "weekly" as const,
  }));
}

export function getIndexableSitemapRows(): SitemapRow[] {
  const seen = new Set<string>();
  const rows: SitemapRow[] = [];

  for (const row of [...MARKETING_AND_HUB_ROUTES, ...calculatorRows()]) {
    if (seen.has(row.path)) continue;
    seen.add(row.path);
    rows.push(row);
  }

  return rows.sort((a, b) => b.priority - a.priority);
}
