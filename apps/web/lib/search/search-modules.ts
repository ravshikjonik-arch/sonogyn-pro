import { MODULES, type ModuleEntry, type ModuleId } from "@repo/clinical-tools";

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreField(haystack: string, query: string): number {
  if (!query) return 0;
  if (haystack === query) return 100;
  if (haystack.startsWith(query)) return 80;
  if (haystack.includes(query)) return 50;
  const parts = query.split(" ").filter(Boolean);
  if (parts.length > 1 && parts.every((p) => haystack.includes(p))) return 45;
  return 0;
}

export type ModuleSearchHit = {
  id: ModuleId;
  title: string;
  description?: string;
  href: string;
  domain: string;
  score: number;
};

/** Resolve IA v2 href for search/navigation (matches modules-migration-map.csv). */
export function resolveModuleSearchHref(mod: ModuleEntry): string | null {
  if (mod.externalHref) return mod.externalHref;
  const id = mod.id;
  const h = mod.href ?? "";

  if (id === "workspace.home") return "/cases";
  if (id === "calculator.hub") return "/tools/calc";
  if (id === "education.library-hub") return "/tools/refs";
  if (id === "mockup.hub") return "/tools/mapping";
  if (id === "billing.paywall") return "/profile/pro";
  if (id.startsWith("assistant.")) {
    return h.startsWith("/assistant") ? h.replace("/assistant", "/ai/consultants") : "/ai/consultants";
  }
  if (id === "workspace.ai") return "/ai/workspace";
  if (id === "calculator.ti-rads") return "/tools/calc/rads/ti-rads";
  if (id === "mockup.uterus" || id === "calculator.figo") return "/tools/mapping/uterus";
  if (id === "mockup.ovary") return "/tools/mapping/ovary";
  if (id === "mockup.breast") return "/tools/mapping/breast";
  if (id === "clinical.idea-endometriosis") return "/tools/mapping/endometriosis";

  if (mod.domain === "obstetrics") {
    if (id === "calculator.ob-hub") return "/tools/calc/ob";
    if (h.startsWith("/calculators/ob")) return h.replace("/calculators/ob", "/tools/calc/ob");
    if (h.startsWith("/calculators/")) return `/tools/calc/ob/${h.replace("/calculators/", "")}`;
  }

  if (mod.domain === "rads" && mod.kind !== "mockup") {
    if (id === "report.adnex-orads") return "/tools/calc/rads/adnex-report";
    if (h.startsWith("/calculators/")) return `/tools/calc/rads/${h.replace("/calculators/", "")}`;
  }

  if (
    mod.domain === "gynecology" &&
    (mod.kind === "calculator" || mod.kind === "calculator-appointment") &&
    h.startsWith("/calculators/")
  ) {
    return `/tools/calc/gyn/${h.replace("/calculators/", "")}`;
  }

  if (mod.domain === "library") {
    const map: Record<string, string> = {
      "/guidelines": "/tools/refs/guidelines",
      "/reference": "/tools/refs/norms",
      "/evidence": "/tools/refs/evidence",
      "/nosologies": "/tools/refs/nosologies",
    };
    if (map[h]) return map[h];
    if (id === "reference.medvedev") return "/tools/refs/consensus";
    return h;
  }

  if (mod.domain === "education") {
    if (id === "education.calculators-shelf") return "/tools/calc";
    if (id === "education.orads-flow") return "/tools/calc/rads/o-rads";
    if (h.startsWith("/library/")) return `/tools/refs/${h.replace("/library/", "")}`;
  }

  if (mod.domain === "infra") {
    if (id === "admin.patients") return "/profile/patients";
    if (id === "admin.dashboard") return "/profile/dashboard";
  }

  return h || null;
}

/** P0.5: index modules with clinicalSearch or calculator/hub kinds. */
export function searchModules(rawQuery: string, limit = 8): ModuleSearchHit[] {
  const query = norm(rawQuery);
  const indexable = MODULES.filter(
    (m) =>
      m.surfaces?.clinicalSearch ||
      m.kind === "calculator" ||
      m.kind === "hub" ||
      m.id.startsWith("assistant."),
  );

  const scored: ModuleSearchHit[] = [];
  for (const mod of indexable) {
    const href = resolveModuleSearchHref(mod);
    if (!href || href.startsWith("http")) continue;

    const blob = norm([mod.title, mod.description ?? "", mod.id.replace(/\./g, " ")].join(" "));
    let score = scoreField(blob, query);
    if (!query) score = mod.surfaces?.clinicalSearch ? 8 : 3;
    if (score <= 0) continue;

    scored.push({
      id: mod.id,
      title: mod.title,
      description: mod.description,
      href,
      domain: mod.domain,
      score,
    });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
