import { CALCULATOR_SEO_REGISTRY } from "@/lib/seo/calculator-seo-registry";

/** Маршруты для precache / offline fallback (калькуляторы + хабы кабинета). */
export function getPwaOfflinePrecachePaths(): string[] {
  const fromRegistry = CALCULATOR_SEO_REGISTRY.map((e) => e.path);
  const hubs = [
    "/",
    "/home",
    "/offline",
    "/app",
    "/dashboard",
    "/tools",
    "/tools/calc",
    "/tools/calc/rads/o-rads",
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const path of [...hubs, ...fromRegistry]) {
    if (seen.has(path)) continue;
    seen.add(path);
    out.push(path);
  }
  return out;
}

/** Быстрые ссылки на офлайн-экране. */
export const OFFLINE_QUICK_LINKS: { href: string; label: string }[] = [
  { href: "/tools/calc/rads/o-rads", label: "O-RADS US" },
  { href: "/tools/calc/rads/bi-rads", label: "BI-RADS US" },
  { href: "/tools/calc/rads/ti-rads", label: "TI-RADS" },
  { href: "/tools/calc/rads/iota", label: "IOTA / ADNEX" },
  { href: "/tools/calc/ob", label: "Акушерство" },
  { href: "/tools/calc/gyn/colposcopy", label: "Кольпоскопия" },
  { href: "/tools/calc", label: "Каталог калькуляторов" },
  { href: "/home", label: "Кабинет" },
];
