/**
 * SSOT: 5 primary tabs — Лента · Кейсы · AI · Инструменты · Профиль.
 * Web adds Lucide icons in apps/web; mobile uses mobileTab + Ionicons in MainTabs.
 */

export const CLINICAL_PRIMARY_TAB_IDS = ["feed", "cases", "ai", "tools", "profile"] as const;

export type ClinicalPrimaryTabId = (typeof CLINICAL_PRIMARY_TAB_IDS)[number];

export type MobilePrimaryTabName =
  | "FeedTab"
  | "CasesTab"
  | "AiTab"
  | "ToolsTab"
  | "ProfileTab";

export type ClinicalPrimaryNavEntry = {
  id: ClinicalPrimaryTabId;
  labelRu: string;
  webHref: string;
  mobileTab: MobilePrimaryTabName;
};

/** Canonical order — same on web bottom bar and iOS/Android tab bar. */
export const CLINICAL_PRIMARY_NAV: ClinicalPrimaryNavEntry[] = [
  { id: "feed", labelRu: "Лента", webHref: "/feed", mobileTab: "FeedTab" },
  { id: "cases", labelRu: "Кейсы", webHref: "/cases", mobileTab: "CasesTab" },
  { id: "ai", labelRu: "AI", webHref: "/ai/consultants", mobileTab: "AiTab" },
  { id: "tools", labelRu: "Инструменты", webHref: "/tools/calc", mobileTab: "ToolsTab" },
  { id: "profile", labelRu: "Профиль", webHref: "/profile", mobileTab: "ProfileTab" },
];

const NAV_BY_ID = new Map(CLINICAL_PRIMARY_NAV.map((e) => [e.id, e]));

export function getPrimaryNavEntry(id: ClinicalPrimaryTabId): ClinicalPrimaryNavEntry {
  const hit = NAV_BY_ID.get(id);
  if (!hit) throw new Error(`Unknown primary tab: ${id}`);
  return hit;
}

export function getPrimaryNavLabel(id: ClinicalPrimaryTabId): string {
  return getPrimaryNavEntry(id).labelRu;
}

export function getMobileTabLabel(tab: MobilePrimaryTabName): string {
  const hit = CLINICAL_PRIMARY_NAV.find((e) => e.mobileTab === tab);
  if (!hit) throw new Error(`Unknown mobile tab: ${tab}`);
  return hit.labelRu;
}

/** @deprecated Use CasesTab — kept for deep-link migration notes only. */
export const LEGACY_MOBILE_TAB_ALIASES: Record<string, MobilePrimaryTabName> = {
  ChatTab: "CasesTab",
  AssistantTab: "AiTab",
  KnowledgeTab: "ToolsTab",
};

/**
 * Resolve active primary tab from Next.js pathname (first match wins).
 */
export function matchClinicalPrimaryTab(pathname: string): ClinicalPrimaryTabId | null {
  const p = pathname.split("?")[0] ?? pathname;

  if (p === "/feed" || p === "/app" || p === "/home") return "feed";

  if (
    p === "/cases" ||
    p.startsWith("/cases/") ||
    p === "/community" ||
    p.startsWith("/community/")
  ) {
    return "cases";
  }

  if (
    p.startsWith("/ai/") ||
    p.startsWith("/assistant") ||
    p === "/workspace" ||
    p.startsWith("/workspace/")
  ) {
    return "ai";
  }

  if (
    p === "/profile" ||
    p.startsWith("/profile/") ||
    p === "/paywall" ||
    p.startsWith("/paywall/") ||
    p === "/dashboard" ||
    p.startsWith("/dashboard/") ||
    p === "/patients" ||
    p.startsWith("/patients/") ||
    p === "/achievements"
  ) {
    return "profile";
  }

  if (
    p === "/tools" ||
    p.startsWith("/tools/") ||
    p === "/calculators" ||
    p.startsWith("/calculators/") ||
    p.startsWith("/reports/") ||
    p === "/library" ||
    p.startsWith("/library/") ||
    p.startsWith("/mockups") ||
    p === "/uterus-3d" ||
    p.startsWith("/uterus-3d") ||
    p === "/ovary-atlas" ||
    p.startsWith("/ovary-atlas") ||
    p === "/breast-3d" ||
    p.startsWith("/breast-3d") ||
    p.startsWith("/idea-deep-endometriosis") ||
    p.startsWith("/guidelines") ||
    p.startsWith("/reference") ||
    p.startsWith("/evidence") ||
    p.startsWith("/nosologies")
  ) {
    return "tools";
  }

  return null;
}
