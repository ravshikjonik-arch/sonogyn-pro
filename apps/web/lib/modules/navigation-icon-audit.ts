import { NAVIGATION_CONFIG, type NavigationIconName } from "@repo/types";

import { isNavigationIconMapped, NAVIGATION_ICON_MAP } from "./resolve-navigation-icon";

export type NavigationIconAuditEntry = {
  id: string;
  title: string;
  icon: NavigationIconName;
  domain: string;
};

export type NavigationIconAuditResult = {
  ok: boolean;
  mappedIconCount: number;
  unmappedIconNames: NavigationIconName[];
  modulesWithMissingMapping: NavigationIconAuditEntry[];
};

/** Modules whose navigation.config icon name has no entry in NAVIGATION_ICON_MAP. */
export function auditNavigationIconMappings(): NavigationIconAuditResult {
  const unmappedIconNames = new Set<NavigationIconName>();
  const modulesWithMissingMapping: NavigationIconAuditEntry[] = [];

  for (const item of NAVIGATION_CONFIG) {
    if (isNavigationIconMapped(item.icon)) continue;
    unmappedIconNames.add(item.icon);
    modulesWithMissingMapping.push({
      id: item.id,
      title: item.title,
      icon: item.icon,
      domain: item.domain,
    });
  }

  return {
    ok: modulesWithMissingMapping.length === 0,
    mappedIconCount: Object.keys(NAVIGATION_ICON_MAP).length,
    unmappedIconNames: [...unmappedIconNames].sort(),
    modulesWithMissingMapping,
  };
}
