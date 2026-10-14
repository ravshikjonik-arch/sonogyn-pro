import type { LucideIcon } from "lucide-react";
import { Calculator, LayoutDashboard, MessageCircle, Sparkles, UserRound } from "lucide-react";

import {
  CLINICAL_PRIMARY_NAV,
  matchClinicalPrimaryTab,
  type ClinicalPrimaryTabId,
} from "@repo/clinical-tools";

export type { ClinicalPrimaryTabId };

export type ClinicalPrimaryTab = {
  id: ClinicalPrimaryTabId;
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

const WEB_ICONS: Record<ClinicalPrimaryTabId, LucideIcon> = {
  feed: LayoutDashboard,
  cases: MessageCircle,
  ai: Sparkles,
  tools: Calculator,
  profile: UserRound,
};

/** Web bottom bar — labels/hrefs/order from @repo/clinical-tools SSOT. */
export const CLINICAL_PRIMARY_TABS: ClinicalPrimaryTab[] = CLINICAL_PRIMARY_NAV.map((entry) => ({
  id: entry.id,
  label: entry.labelRu,
  href: entry.webHref,
  icon: WEB_ICONS[entry.id],
  match: (pathname: string) => matchClinicalPrimaryTab(pathname) === entry.id,
}));

export function resolveClinicalPrimaryTab(pathname: string): ClinicalPrimaryTabId | null {
  return matchClinicalPrimaryTab(pathname);
}
