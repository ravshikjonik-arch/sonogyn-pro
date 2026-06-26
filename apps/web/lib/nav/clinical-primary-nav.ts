import type { LucideIcon } from "lucide-react";
import { Calculator, Home, MessageCircle, UserRound } from "lucide-react";

export type ClinicalPrimaryTabId = "feed" | "cases" | "tools" | "profile";

export type ClinicalPrimaryTab = {
  id: ClinicalPrimaryTabId;
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

/** P0 primary navigation — bottom bar SSOT (AI via Global Search ⌘K, TD-NAV-AI-TAB closed). */
export const CLINICAL_PRIMARY_TABS: ClinicalPrimaryTab[] = [
  {
    id: "feed",
    label: "Лента",
    href: "/feed",
    icon: Home,
    match: (pathname) => pathname === "/feed" || pathname.startsWith("/feed/"),
  },
  {
    id: "cases",
    label: "Кейсы",
    href: "/cases",
    icon: MessageCircle,
    match: (pathname) =>
      pathname === "/cases" ||
      pathname.startsWith("/cases/") ||
      pathname === "/community" ||
      pathname.startsWith("/community/"),
  },
  {
    id: "tools",
    label: "Инструменты",
    href: "/tools",
    icon: Calculator,
    match: (pathname) =>
      pathname === "/tools" ||
      pathname.startsWith("/tools/") ||
      pathname.startsWith("/ai/consultants") ||
      pathname.startsWith("/assistant") ||
      pathname.startsWith("/workspace") ||
      pathname === "/calculators" ||
      pathname.startsWith("/calculators/") ||
      pathname.startsWith("/reports/") ||
      pathname.startsWith("/tools/refs/") ||
      pathname === "/library" ||
      pathname.startsWith("/guidelines") ||
      pathname.startsWith("/reference") ||
      pathname.startsWith("/evidence") ||
      pathname.startsWith("/nosologies") ||
      pathname.startsWith("/mockups") ||
      pathname.startsWith("/uterus-3d") ||
      pathname.startsWith("/ovary-atlas") ||
      pathname.startsWith("/breast-3d") ||
      pathname.startsWith("/idea-deep-endometriosis"),
  },
  {
    id: "profile",
    label: "Профиль",
    href: "/profile",
    icon: UserRound,
    match: (pathname) =>
      pathname === "/profile" ||
      pathname.startsWith("/profile/") ||
      pathname === "/paywall" ||
      pathname.startsWith("/paywall/") ||
      pathname.startsWith("/ai/") ||
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname === "/patients" ||
      pathname.startsWith("/patients/") ||
      pathname === "/achievements",
  },
];

export function resolveClinicalPrimaryTab(pathname: string): ClinicalPrimaryTabId | null {
  const hit = CLINICAL_PRIMARY_TABS.find((tab) => tab.match(pathname));
  return hit?.id ?? null;
}
